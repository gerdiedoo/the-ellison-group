import 'server-only';
import { z } from 'zod';
import { all, base } from '@/lib/repository';
import { ApiError } from '@/lib/security';
import { isMock, isProd } from '@/lib/env';
import type { Profile, Lead, Listing, Json } from '@/lib/types';
import {
  canManageLead,
  canManageListing,
  canManageConversation,
  canManageTask,
} from './permissions';
import {
  listingInput,
  leadEdit,
  taskInput,
  appointmentInput,
  stageInput,
  ruleInput,
  templateInput,
  campaignInput,
  captureInput,
  assistantInput,
  commandSchema,
} from './schemas';
import { put, del, audit, commit, type Operation } from './transaction';
import { runAutomations, runDueAutomations } from './automations';
import { normalizeEmail, normalizePhone, STAGE_IDS } from './defaults';
import { deliver } from '@/lib/email';
import { captureLead } from '@/lib/leads';
import { leadSchema } from '@/lib/schemas';
import { hash } from '@/lib/security';
import { validListingTransition } from './lifecycle';
export async function platformCommand(user: Profile, raw: unknown) {
  const input = commandSchema.parse(raw),
    now = new Date().toISOString(),
    ops: Operation[] = [];
  let result: Record<string, unknown> = { success: true };
  const assignedLeads = new Set<string>();
  const admin = () => {
    if (user.role !== 'admin')
      throw new ApiError(403, 'Only administrators can change this setting.');
  };
  const profiles = await all('profiles', true);
  const assignment = (id: string | null) => {
    if (id && !profiles.some((p) => p.id === id && ['admin', 'agent'].includes(p.role)))
      throw new ApiError(400, 'Choose an existing staff account.');
    if (user.role === 'agent' && id !== user.id)
      throw new ApiError(403, 'Agents can assign records only to themselves.');
  };
  const lead = async (id: string) => {
    const row = (await all('leads', true)).find((l) => l.id === id);
    if (!row || !canManageLead(user, row))
      throw new ApiError(404, 'Lead not found in your assigned records.');
    return row;
  };
  const listing = async (id: string) => {
    const row = (await all('listings', true)).find((l) => l.id === id);
    if (!row || !canManageListing(user, row))
      throw new ApiError(404, 'Property not found in your assigned records.');
    return row;
  };
  const referencedListing = async (id: string) => {
    const row = (await all('listings', true)).find((l) => l.id === id);
    if (
      !row ||
      (!canManageListing(user, row) && (row.hidden || row.publication_status !== 'published'))
    )
      throw new ApiError(404, 'Property not found.');
    return row;
  };
  const activity = (
    kind: string,
    body: string,
    refs: {
      lead_id?: string | null;
      listing_id?: string | null;
      conversation_id?: string | null;
    } = {},
    payload: Json = {},
  ) =>
    ops.push(
      put('activities', {
        ...base(),
        actor_id: user.id,
        lead_id: refs.lead_id || null,
        listing_id: refs.listing_id || null,
        conversation_id: refs.conversation_id || null,
        kind,
        body,
        payload,
        is_internal: true,
      }),
    );
  if (input.action === 'lead_create') {
    const values = z
      .object({
        first_name: z.string().trim().min(1).max(100),
        last_name: z.string().max(100),
        email: z.string().trim().email(),
        phone: z.string().max(40),
        message: z.string().max(3000),
      })
      .parse(input.values);
    const existing = (await all('leads', true)).find(
      (l) => normalizeEmail(l.email) === normalizeEmail(values.email),
    );
    if (existing && !canManageLead(user, existing))
      throw new ApiError(409, 'This contact is already managed by another team member.');
    const captured = await captureLead(
      leadSchema.parse({
        ...values,
        source: 'contact',
        trigger_source: 'manual-admin',
        email_phone: false,
        sms: false,
      }),
      { ip_hash: hash(`staff:${user.id}`), user_agent: 'Manually entered by authenticated staff' },
      user.id,
    );
    await commit([
      audit(user.id, 'leads', captured.lead_id, 'contact_entered_by_staff', { actor: user.id }),
    ]);
    return { success: true, id: captured.lead_id };
  } else if (input.action === 'listing_save') {
    const data = listingInput.parse(input.values),
      old = input.id ? await listing(input.id) : null;
    const inventory = await all('listings', true);
    if (user.role === 'agent' && data.listing_agent_id !== user.agent_id)
      throw new ApiError(403, 'Assign this property to your linked agent profile.');
    if (old && !validListingTransition(old.status, data.status))
      throw new ApiError(
        409,
        'A closed transaction cannot be reopened. Create a new listing to relist the property.',
      );
    if (
      inventory.some((l) => l.id !== input.id && (l.slug === data.slug || l.mls_id === data.mls_id))
    )
      throw new ApiError(409, 'That listing ID or public URL is already in use.');
    const [agents, neighborhoods] = await Promise.all([
      all('agents', true),
      all('neighborhoods', true),
    ]);
    if (
      !agents.some((a) => a.id === data.listing_agent_id) ||
      !neighborhoods.some((n) => n.id === data.neighborhood_id)
    )
      throw new ApiError(400, 'Choose an existing agent and neighborhood.');
    const id = old?.id || base().id;
    const record: Listing = {
      ...base(),
      ...(old || {}),
      ...data,
      id,
      updated_at: now,
      hidden: data.publication_status !== 'published',
      mls_id_locked: old?.mls_id_locked ?? false,
      synced_at: old?.synced_at || now,
      raw: {
        ...data.raw,
        demo: isMock,
        published_once: Boolean(
          old?.raw.published_once ||
          old?.publication_status === 'published' ||
          data.publication_status === 'published',
        ),
      },
      listing_photos: data.listing_photos.map((p, i) => ({
        ...base(),
        ...p,
        listing_id: id,
        sort_order: i,
        blurhash: '',
      })),
      listing_features: data.listing_features.map((f) => ({ ...base(), ...f, listing_id: id })),
    };
    if (old?.mls_id_locked && old.mls_id !== record.mls_id)
      throw new ApiError(
        400,
        'The licensed/seed feed ID is locked. Create a manual listing instead.',
      );
    if (!isMock && old) {
      ops.push(
        ...old.listing_photos.map((p) => ({
          action: 'delete' as const,
          table: 'listing_photos' as const,
          id: p.id,
        })),
        ...old.listing_features.map((f) => ({
          action: 'delete' as const,
          table: 'listing_features' as const,
          id: f.id,
        })),
      );
    }
    ops.push(put('listings', record));
    if (!isMock) {
      ops.push(
        ...record.listing_photos.map((p) => ({
          action: 'upsert' as const,
          table: 'listing_photos' as const,
          record: p,
        })),
        ...record.listing_features.map((f) => ({
          action: 'upsert' as const,
          table: 'listing_features' as const,
          record: f,
        })),
      );
    }
    ops.push(
      audit(user.id, 'listings', id, old ? 'listing_updated' : 'listing_created', {
        before: old,
        after: record,
      }),
    );
    activity(
      old ? 'listing_updated' : 'listing_created',
      `${record.address_line} · ${record.publication_status}`,
      { listing_id: id },
    );
    result = { success: true, id };
  } else if (input.action === 'listing_archive' || input.action === 'listing_delete') {
    const row = await listing(input.id!);
    if (input.action === 'listing_delete') {
      admin();
      const { confirmation } = z.object({ confirmation: z.string() }).parse(input.values);
      if (confirmation !== row.address_line)
        throw new ApiError(400, 'Type the complete property address to confirm deletion.');
      const links = await all('lead_properties', true);
      if (
        row.publication_status !== 'draft' ||
        row.mls_id_locked ||
        Boolean(row.raw.published_once) ||
        (await all('leads', true)).some((l) => l.listing_id === row.id) ||
        (await all('tasks', true)).some((t) => t.listing_id === row.id) ||
        (await all('conversations', true)).some((c) => c.listing_id === row.id) ||
        (await all('campaigns', true)).some((c) => c.listing_id === row.id) ||
        links.some((p) => p.listing_id === row.id) ||
        (await all('showing_requests', true)).some((a) => a.listing_id === row.id)
      )
        throw new ApiError(
          409,
          'Properties with a public history or inquiries must be archived to preserve their records.',
        );
      for (const saved of (await all('saved_homes', true)).filter((h) => h.listing_id === row.id))
        ops.push(del('saved_homes', saved.id));
      ops.push(del('listings', row.id));
    } else
      ops.push(
        put('listings', { ...row, hidden: true, publication_status: 'archived', updated_at: now }),
      );
    ops.push(audit(user.id, 'listings', row.id, input.action, { before: row }));
  } else if (input.action === 'listing_bulk') {
    const data = z
      .object({ operation: z.enum(['archive', 'feature', 'unfeature']) })
      .parse(input.values);
    const ids = z.array(z.string().uuid()).min(1).max(100).parse(input.ids);
    for (const id of ids) {
      const row = await listing(id);
      ops.push(
        put('listings', {
          ...row,
          ...(data.operation === 'archive'
            ? { hidden: true, publication_status: 'archived' as const }
            : { is_featured: data.operation === 'feature' }),
          updated_at: now,
        }),
        audit(user.id, 'listings', id, `bulk_${data.operation}`, {
          before: row.publication_status,
        }),
      );
    }
  } else if (input.action === 'lead_save') {
    const old = await lead(input.id!),
      data = leadEdit.parse(input.values);
    assignment(data.assigned_to);
    const stage = (await all('pipeline_stages', true)).find((s) => s.id === data.stage_id);
    if (!stage) throw new ApiError(400, 'Choose an existing pipeline stage.');
    const identity = (await all('lead_identities', true)).find(
      (i) => i.normalized_email === normalizeEmail(data.email),
    );
    if (identity && identity.lead_id !== old.id)
      throw new ApiError(409, 'That email already belongs to another contact.');
    const status =
      stage.outcome !== 'open' ? 'closed' : stage.sort_order === 0 ? 'new' : 'contacted';
    const updated: Lead = {
      ...old,
      ...data,
      status,
      phone: normalizePhone(data.phone),
      updated_at: now,
    };
    ops.push(
      put('leads', updated),
      audit(user.id, 'leads', old.id, 'lead_updated', { before: old, after: updated }),
    );
    if (!identity)
      ops.push(
        put('lead_identities', {
          ...base(),
          normalized_email: normalizeEmail(data.email),
          lead_id: old.id,
        }),
      );
    activity('contact_updated', 'Contact information and preferences updated.', {
      lead_id: old.id,
    });
    if (old.stage_id !== data.stage_id)
      activity(
        'stage_changed',
        `Moved to ${stage.name}.`,
        { lead_id: old.id },
        { from: old.stage_id, to: data.stage_id, outcome: stage.outcome },
      );
    if (old.assigned_to !== data.assigned_to) assignedLeads.add(old.id);
    if (old.assigned_to !== data.assigned_to)
      activity(
        'lead_assigned',
        'Staff assignment updated.',
        { lead_id: old.id },
        { assigned_to: data.assigned_to },
      );
  } else if (input.action === 'lead_bulk_assign') {
    admin();
    const { assigned_to } = z.object({ assigned_to: z.string().uuid() }).parse(input.values);
    assignment(assigned_to);
    for (const id of z.array(z.string().uuid()).min(1).max(100).parse(input.ids)) {
      const row = await lead(id);
      if (row.assigned_to !== assigned_to) assignedLeads.add(row.id);
      ops.push(
        put('leads', { ...row, assigned_to, updated_at: now }),
        audit(user.id, 'leads', id, 'lead_assigned', { assigned_to }),
      );
      activity('lead_assigned', 'Bulk staff assignment updated.', { lead_id: id }, { assigned_to });
    }
  } else if (input.action === 'activity_note') {
    const data = z
      .object({
        lead_id: z.string().uuid().nullable(),
        listing_id: z.string().uuid().nullable(),
        body: z.string().trim().min(1).max(5000),
      })
      .parse(input.values);
    if (data.lead_id) await lead(data.lead_id);
    if (data.listing_id)
      await (data.lead_id ? referencedListing(data.listing_id) : listing(data.listing_id));
    if (!data.lead_id && !data.listing_id)
      throw new ApiError(400, 'Choose a contact or property for this note.');
    activity('manual_note', data.body, data);
    ops.push(
      audit(user.id, 'activities', input.id || '', input.action, {
        lead_id: data.lead_id,
        listing_id: data.listing_id,
      }),
    );
  } else if (input.action === 'task_save') {
    const data = taskInput.parse(input.values);
    const old = input.id ? (await all('tasks', true)).find((t) => t.id === input.id) : null;
    if (input.id && (!old || !canManageTask(user, old))) throw new ApiError(404, 'Task not found.');
    assignment(data.assigned_to);
    if (data.lead_id) await lead(data.lead_id);
    if (data.listing_id) await referencedListing(data.listing_id);
    const row = {
      ...base(),
      ...(old || {}),
      ...data,
      updated_at: now,
      completed_at: data.status === 'completed' ? now : null,
      automation_key: old?.automation_key || null,
    };
    ops.push(put('tasks', row), audit(user.id, 'tasks', row.id, 'task_saved', data));
    if (data.lead_id || data.listing_id)
      activity(
        data.status === 'completed' ? 'follow_up_completed' : 'task_created',
        row.title,
        data,
      );
    result = { success: true, id: row.id };
  } else if (input.action === 'appointment_save') {
    const data = appointmentInput.parse(input.values),
      old = input.id ? (await all('showing_requests', true)).find((a) => a.id === input.id) : null;
    if (input.id && !old) throw new ApiError(404, 'Appointment not found.');
    if (
      old &&
      user.role === 'agent' &&
      old.assigned_to !== user.id &&
      !(await all('leads', true)).some((l) => l.id === old.lead_id && canManageLead(user, l))
    )
      throw new ApiError(404, 'Appointment not found in your assigned schedule.');
    await lead(data.lead_id);
    if (data.listing_id) await referencedListing(data.listing_id);
    assignment(data.assigned_to);
    if (
      !old &&
      ['requested', 'confirmed'].includes(data.status) &&
      Date.parse(data.starts_at) < Date.now() - 300000
    )
      throw new ApiError(400, 'New appointments must be in the future.');
    const overlap = (await all('showing_requests', true)).some(
      (a) =>
        a.id !== old?.id &&
        data.assigned_to &&
        a.assigned_to === data.assigned_to &&
        ['requested', 'confirmed'].includes(a.status) &&
        ['requested', 'confirmed'].includes(data.status) &&
        Date.parse(a.starts_at) < Date.parse(data.ends_at) &&
        Date.parse(a.ends_at) > Date.parse(data.starts_at),
    );
    if (overlap)
      throw new ApiError(409, 'That staff member already has an appointment during this time.');
    const row = { ...base(), ...(old || {}), ...data, updated_at: now };
    ops.push(
      put('showing_requests', row),
      audit(user.id, 'showing_requests', row.id, 'appointment_saved', data),
    );
    activity(
      old ? 'appointment_updated' : 'appointment_created',
      `${data.kind.replaceAll('_', ' ')} · ${data.status}`,
      { lead_id: data.lead_id, listing_id: data.listing_id },
      { starts_at: data.starts_at },
    );
    result = { success: true, id: row.id };
  } else if (input.action === 'conversation_update' || input.action === 'conversation_reply') {
    const row = (await all('conversations', true)).find((c) => c.id === input.id);
    if (!row || !canManageConversation(user, row))
      throw new ApiError(404, 'Conversation not found in your assigned inbox.');
    if (input.action === 'conversation_update') {
      const data = z
        .object({
          assigned_to: z.string().uuid().nullable(),
          mode: z.enum(['ai', 'human']),
          status: z.enum(['open', 'waiting', 'resolved']),
        })
        .parse(input.values);
      assignment(data.assigned_to);
      ops.push(
        put('conversations', { ...row, ...data, updated_at: now }),
        audit(user.id, 'conversations', row.id, 'conversation_updated', data),
      );
      activity(
        'conversation_updated',
        `Conversation ${data.status}; ${data.mode === 'human' ? 'human handling' : 'AI handling'}.`,
        { lead_id: row.lead_id, conversation_id: row.id },
      );
    } else {
      const data = z
        .object({ body: z.string().trim().min(1).max(5000), is_internal: z.boolean() })
        .parse(input.values);
      if (row.status === 'resolved')
        throw new ApiError(409, 'Reopen this conversation before replying.');
      ops.push(
        put('conversation_messages', {
          ...base(),
          conversation_id: row.id,
          role: 'agent',
          body: data.body,
          is_internal: data.is_internal,
          actor_id: user.id,
          request_id: input.request_id || null,
          provider: null,
        }),
        put('conversations', {
          ...row,
          mode: data.is_internal ? row.mode : 'human',
          updated_at: now,
          last_message_at: now,
        }),
      );
      activity(
        data.is_internal ? 'internal_note' : 'message_sent',
        data.is_internal
          ? 'Internal conversation note added.'
          : 'Human reply saved to the visitor conversation.',
        { lead_id: row.lead_id, conversation_id: row.id },
      );
    }
  } else if (['rule_save', 'template_save', 'campaign_save', 'stage_save'].includes(input.action)) {
    admin();
    const mapping = {
      rule_save: ['automation_rules', ruleInput],
      template_save: ['message_templates', templateInput],
      campaign_save: ['campaigns', campaignInput],
      stage_save: ['pipeline_stages', stageInput],
    } as const;
    const [table, schema] = mapping[input.action as keyof typeof mapping];
    const values = schema.parse(input.values),
      old = input.id ? (await all(table, true)).find((r) => r.id === input.id) : null;
    if (
      input.action === 'stage_save' &&
      input.id === STAGE_IDS[0] &&
      stageInput.parse(values).outcome !== 'open'
    )
      throw new ApiError(
        400,
        'The initial capture stage must remain open. You can rename it or change its order.',
      );
    if (input.id && !old) throw new ApiError(404, 'Record not found.');
    if (input.action === 'rule_save') assignment(ruleInput.parse(values).assigned_to);
    if (input.action === 'campaign_save') {
      const c = campaignInput.parse(values);
      if ((await all('campaigns', true)).some((row) => row.slug === c.slug && row.id !== input.id))
        throw new ApiError(409, 'That campaign URL is already in use.');
      if (c.listing_id) {
        const target = await listing(c.listing_id);
        if (c.status === 'active' && (target.hidden || target.publication_status !== 'published'))
          throw new ApiError(400, 'Publish the property before activating its campaign.');
      }
    }
    const record = { ...base(), ...(old || {}), ...values, updated_at: now };
    ops.push(
      { action: 'upsert', table, record },
      audit(user.id, table, record.id, input.action, values),
    );
    result = { success: true, id: record.id };
  } else if (input.action === 'platform_settings') {
    admin();
    const data = z
        .object({ lead_capture: captureInput, assistant: assistantInput })
        .parse(input.values),
      settings = await all('site_settings', true);
    for (const [key, value] of Object.entries(data)) {
      const old = settings.find((s) => s.key === key),
        record = {
          ...base(),
          ...(old || {}),
          key,
          value: JSON.parse(JSON.stringify(value)) as Json,
          updated_at: now,
        };
      ops.push(
        put('site_settings', record),
        audit(user.id, 'site_settings', record.id, 'settings_updated', { key, value }),
      );
    }
  } else if (input.action === 'team_save') {
    admin();
    const data = z
      .object({
        email: z
          .string()
          .trim()
          .email()
          .transform((v) => v.toLowerCase()),
        full_name: z.string().trim().min(1).max(100),
        role: z.enum(['user', 'agent', 'admin']),
        agent_id: z.string().uuid().nullable(),
      })
      .parse(input.values);
    const old = profiles.find((p) => p.id === input.id || p.email === data.email);
    if (!old && !isMock)
      throw new ApiError(
        400,
        'Invite this account through Supabase Auth first, then assign its role here.',
      );
    if (old?.id === user.id && data.role !== 'admin')
      throw new ApiError(400, 'You cannot remove your own administrator access.');
    if (data.role === 'agent' && !data.agent_id)
      throw new ApiError(400, 'Link an agent profile to scope this account’s property access.');
    if (data.agent_id && !(await all('agents', true)).some((a) => a.id === data.agent_id))
      throw new ApiError(400, 'Choose an existing agent profile.');
    const record: Profile = {
      ...base(),
      phone: '',
      notification_prefs: {},
      ...(old || {}),
      ...data,
      updated_at: now,
    };
    ops.push(
      put('profiles', record),
      audit(user.id, 'profiles', record.id, 'team_role_updated', {
        role: data.role,
        agent_id: data.agent_id,
      }),
    );
    result = { success: true, id: record.id };
  } else if (input.action === 'notification_read') {
    const row = (await all('notifications', true)).find(
      (n) => n.id === input.id && (n.user_id === user.id || user.role === 'admin'),
    );
    if (!row) throw new ApiError(404, 'Notification not found.');
    ops.push(put('notifications', { ...row, read_at: now, updated_at: now }));
  } else if (input.action === 'run_automations') {
    admin();
    return { success: true, ...(await runDueAutomations()) };
  } else if (input.action === 'send_message') {
    const data = z
        .object({
          lead_id: z.string().uuid(),
          channel: z.enum(['email', 'sms']),
          subject: z.string().max(200),
          body: z.string().trim().min(1).max(5000),
        })
        .parse(input.values),
      row = await lead(data.lead_id);
    if (data.channel === 'email' && !data.subject.trim())
      throw new ApiError(400, 'Enter an email subject.');
    if (
      isMock ||
      !isProd ||
      process.env.DELIVERY_MODE !== 'live' ||
      (data.channel === 'email' &&
        (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL)) ||
      (data.channel === 'sms' &&
        (!process.env.TWILIO_ACCOUNT_SID ||
          !process.env.TWILIO_AUTH_TOKEN ||
          !process.env.TWILIO_PHONE_NUMBER))
    )
      throw new ApiError(
        503,
        'External delivery is not configured in this environment. Save an internal note or a message template instead.',
      );
    const granted = (await all('consents', true))
      .filter(
        (c) =>
          c.lead_id === row.id && c.channel === (data.channel === 'sms' ? 'sms' : 'email_phone'),
      )
      .sort((a, b) => b.granted_at.localeCompare(a.granted_at))[0]?.granted;
    if (!granted) throw new ApiError(400, 'This contact has not granted consent for that channel.');
    const outbox = {
      ...base(),
      id: input.request_id || base().id,
      channel: data.channel,
      recipient: data.channel === 'sms' ? row.phone : row.email,
      subject: data.subject,
      body: data.body,
      attachments: [],
      sent_at: null,
    };
    if (!outbox.recipient)
      throw new ApiError(400, 'This contact has no destination for that channel.');
    const existing = (await all('dev_outbox', true)).find((o) => o.id === outbox.id);
    if (existing?.sent_at)
      return { success: true, message: 'This request was already accepted by the provider.' };
    if (existing)
      throw new ApiError(
        409,
        'This delivery request is already queued. Review the outbox before retrying.',
      );
    ops.push(
      put('dev_outbox', outbox),
      audit(user.id, 'dev_outbox', outbox.id, 'message_queued', {
        lead_id: row.id,
        channel: data.channel,
      }),
    );
    await commit(ops);
    await deliver(outbox);
    await commit([
      put('activities', {
        ...base(),
        lead_id: row.id,
        listing_id: null,
        conversation_id: null,
        actor_id: user.id,
        kind: 'message_sent',
        body: `${data.channel} accepted by the configured provider.`,
        payload: {
          outbox_id: outbox.id,
          message: data.body,
          subject: data.subject,
          channel: data.channel,
        },
        is_internal: true,
      }),
    ]);
    return { success: true, message: 'Accepted by the provider. Delivery is not yet confirmed.' };
  } else throw new ApiError(400, 'Unsupported action.');
  const interactionIds = new Set(
    ops.flatMap((op) =>
      op.action === 'upsert' && op.table === 'activities' && typeof op.record.lead_id === 'string'
        ? [op.record.lead_id]
        : [],
    ),
  );
  for (const id of interactionIds) {
    const pending = ops.find(
      (op) => op.action === 'upsert' && op.table === 'leads' && op.record.id === id,
    );
    const previous =
      pending && pending.action === 'upsert'
        ? pending.record
        : (await all('leads', true)).find((l) => l.id === id);
    if (previous)
      ops.push({
        action: 'upsert',
        table: 'leads',
        record: { ...previous, last_interaction_at: now, updated_at: now },
      });
  }
  await commit(ops);
  for (const id of assignedLeads) {
    const row = (await all('leads', true)).find((l) => l.id === id)!;
    await runAutomations(
      'lead_assigned',
      row,
      `assignment:${row.id}:${row.assigned_to}:${row.updated_at}`,
    );
  }
  if (input.action === 'appointment_save') {
    const appointment = (await all('showing_requests', true)).find((a) => a.id === result.id);
    if (appointment && ['requested', 'confirmed'].includes(appointment.status))
      await runAutomations(
        'appointment_scheduled',
        await lead(appointment.lead_id),
        `appointment:${appointment.id}`,
      );
  }
  return result;
}
