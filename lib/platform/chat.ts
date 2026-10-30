import 'server-only';
import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { all, base, mutateStore } from '@/lib/repository';
import { hash, ApiError } from '@/lib/security';
import { isMock } from '@/lib/env';
import { getAssistantConfig, publicListingRecords } from './capture';
import { put, commit, applyMock } from './transaction';
import { gatewayAssistant, selectAssistantCatalog, type AssistantProvider } from './assistant';
import type { Conversation, ChatMessage } from './types';
const SESSION = 'ellison-chat-session';
export async function visitorSession(create = false, secure = false) {
  const jar = await cookies();
  let token = jar.get(SESSION)?.value;
  if (token && !/^[A-Za-z0-9_-]{43}$/.test(token)) token = undefined;
  if (!token && create) {
    token = randomBytes(32).toString('base64url');
    jar.set(SESSION, token, { httpOnly: true, secure, sameSite: 'lax', maxAge: 604800, path: '/' });
  }
  return token ? hash(`chat:${token}`) : null;
}
export async function ownConversation(id: string | null, session: string | null) {
  if (!session) return null;
  return (
    (await all('conversations', true))
      .filter((c) => c.session_hash === session && (!id || c.id === id))
      .sort((a, b) => b.last_message_at.localeCompare(a.last_message_at))[0] || null
  );
}
export async function publicChat(id: string | null, session: string | null) {
  const config = await getAssistantConfig(),
    conversation = await ownConversation(id, session);
  if (id && !conversation) throw new ApiError(404, 'Conversation not found.');
  const messages = conversation
    ? (await all('conversation_messages', true))
        .filter(
          (m) => m.conversation_id === conversation.id && !m.is_internal && m.role !== 'system',
        )
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
    : [];
  const listings = await publicListingRecords(
    (await all('listings', true)).filter((l) => !l.hidden && l.publication_status === 'published'),
  );
  return {
    enabled: config.enabled,
    configured: Boolean(process.env.AI_GATEWAY_API_KEY && process.env.AI_GATEWAY_MODEL),
    conversation: conversation
      ? {
          id: conversation.id,
          mode: conversation.mode,
          status: conversation.status,
          ai_status: conversation.ai_status,
        }
      : null,
    messages: messages.map(({ id, role, body, created_at, property_ids }) => ({
      id,
      role,
      body,
      created_at,
      properties: (property_ids || []).flatMap((id) => {
        const l = listings.find((l) => l.id === id);
        return l
          ? [
              {
                id: l.id,
                slug: l.slug,
                address_line: l.address_line,
                price: l.list_price,
                kind: l.listing_kind,
                status: l.status,
                beds: l.beds,
              },
            ]
          : [];
      }),
    })),
  };
}
export async function visitorChat(
  input: {
    action: 'message' | 'handoff';
    conversation_id?: string;
    request_id: string;
    message?: string;
    listing_id?: string;
    property_slug?: string;
  },
  session: string,
  provider: AssistantProvider = gatewayAssistant,
) {
  const config = await getAssistantConfig();
  if (!config.enabled) throw new ApiError(404, 'Chat is currently unavailable.');
  let conversation = await ownConversation(input.conversation_id || null, session);
  if (input.conversation_id && !conversation) throw new ApiError(404, 'Conversation not found.');
  if (conversation?.status === 'resolved')
    throw new ApiError(
      409,
      'This conversation has been resolved. Contact the team through the contact form for a new request.',
    );
  const inventory = (await all('listings', true)).filter(
      (l) => !l.hidden && l.publication_status === 'published',
    ),
    listing = inventory.find((l) =>
      input.listing_id ? l.id === input.listing_id : l.slug === input.property_slug,
    );
  if (input.listing_id && !listing) throw new ApiError(404, 'Property not found.');
  const now = new Date().toISOString();
  if (!conversation) {
    conversation = {
      ...base(),
      session_hash: session,
      lead_id: null,
      listing_id: listing?.id || null,
      assigned_to: null,
      mode: 'ai',
      status: 'open',
      summary: '',
      recommendation: '',
      ai_status:
        process.env.AI_GATEWAY_API_KEY && process.env.AI_GATEWAY_MODEL ? 'ready' : 'unconfigured',
      last_message_at: now,
    };
    await commit([put('conversations', conversation)]);
  }
  const row: Conversation = conversation,
    messages = (await all('conversation_messages', true)).filter(
      (m) => m.conversation_id === row.id,
    );
  if (messages.some((m) => m.request_id === input.request_id))
    return { success: true, ...(await publicChat(row.id, session)) };
  if (messages.length >= 100)
    throw new ApiError(
      429,
      'This conversation has reached its message limit. Please contact the team directly.',
    );
  if (input.action === 'handoff') {
    if (row.mode === 'human') return { success: true, ...(await publicChat(row.id, session)) };
    await commit([
      put('conversations', { ...row, mode: 'human', status: 'waiting', updated_at: now }),
      put('activities', {
        ...base(),
        lead_id: row.lead_id,
        listing_id: row.listing_id,
        conversation_id: row.id,
        actor_id: null,
        kind: 'human_handoff_requested',
        body: 'The visitor requested a human connection.',
        payload: {},
        is_internal: true,
      }),
      put('notifications', {
        ...base(),
        user_id: row.assigned_to,
        title: 'A visitor would like a personal connection',
        body: 'Open the conversation inbox to review and respond.',
        lead_id: row.lead_id,
        read_at: null,
      }),
    ]);
    return { success: true, ...(await publicChat(row.id, session)) };
  }
  const visitor: ChatMessage = {
    ...base(),
    conversation_id: row.id,
    role: 'visitor',
    body: input.message!,
    is_internal: false,
    actor_id: null,
    request_id: input.request_id,
    provider: null,
  };
  const associatedLead = row.lead_id
    ? (await all('leads', true)).find((l) => l.id === row.lead_id)
    : null;
  await commit(
    [
      put('conversation_messages', visitor),
      put('conversations', { ...row, last_message_at: now, updated_at: now }),
      ...(associatedLead
        ? [
            put('leads', { ...associatedLead, last_interaction_at: now, updated_at: now }),
            put('activities', {
              ...base(),
              lead_id: associatedLead.id,
              listing_id: row.listing_id,
              conversation_id: row.id,
              actor_id: null,
              kind: 'message_received',
              body: 'A visitor message was saved in the website conversation.',
              payload: {},
              is_internal: true,
            }),
          ]
        : []),
    ],
    `chat:${row.id}`,
  );
  const savedVisitor = (await all('conversation_messages', true)).find(
    (m) => m.conversation_id === row.id && m.request_id === input.request_id,
  );
  if (savedVisitor?.id !== visitor.id)
    return { success: true, ...(await publicChat(row.id, session)) };
  if (row.mode === 'human') return { success: true, ...(await publicChat(row.id, session)) };
  try {
    const catalog = selectAssistantCatalog(
      await publicListingRecords(inventory),
      input.message || '',
      row.listing_id,
    );
    const answer = await provider.respond({
      config,
      catalog,
      messages: [...messages.filter((m) => !m.is_internal && m.role !== 'system'), visitor],
    });
    const fresh = await ownConversation(row.id, session);
    if (!fresh || fresh.mode !== 'ai' || fresh.status === 'resolved')
      return { success: true, ...(await publicChat(row.id, session)) };
    const reply: ChatMessage = {
      ...base(),
      conversation_id: row.id,
      role: 'assistant',
      body: answer.reply,
      is_internal: false,
      actor_id: null,
      request_id: null,
      reply_to: visitor.id,
      property_ids: answer.property_ids,
      provider: process.env.AI_GATEWAY_MODEL || null,
    };
    const operations = [
      put('conversation_messages', reply),
      put('conversations', {
        ...fresh,
        summary: answer.summary,
        recommendation: answer.suggested_follow_up,
        ai_status: 'ready' as const,
        mode: answer.request_human ? ('human' as const) : ('ai' as const),
        status: answer.request_human ? ('waiting' as const) : ('open' as const),
        last_message_at: reply.created_at,
        updated_at: reply.created_at,
      }),
    ];
    if (isMock)
      await mutateStore((store) => {
        const current = store.conversations.find((c) => c.id === row.id),
          latest = store.conversation_messages
            .filter((m) => m.conversation_id === row.id && m.role === 'visitor')
            .at(-1);
        if (
          current?.mode === 'ai' &&
          current.status !== 'resolved' &&
          latest?.id === visitor.id &&
          !store.conversation_messages.some((m) => m.reply_to === visitor.id)
        )
          applyMock(store, operations);
      });
    else await commit(operations, `chat:${row.id}`);
    return { success: true, ...(await publicChat(row.id, session)) };
  } catch (error) {
    const fresh = await ownConversation(row.id, session);
    if (fresh?.mode === 'ai')
      await commit([
        put('conversations', {
          ...fresh,
          ai_status:
            process.env.AI_GATEWAY_API_KEY && process.env.AI_GATEWAY_MODEL
              ? 'failed'
              : 'unconfigured',
          status: 'waiting',
          updated_at: new Date().toISOString(),
        }),
      ]);
    console.error('[assistant]', error instanceof Error ? error.name : 'ProviderError');
    return {
      success: false,
      error:
        'Your question has been saved. The AI assistant is unavailable right now. You can request a personal reply from the team.',
      ...(await publicChat(row.id, session)),
    };
  }
}
