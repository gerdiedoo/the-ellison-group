import 'server-only';
import { all } from '@/lib/repository';
import type { Profile } from '@/lib/types';
import {
  canManageLead,
  canManageListing,
  canManageConversation,
  canManageTask,
} from './permissions';
import { isMock, isProd } from '@/lib/env';
import { defaultCapture, defaultAssistant } from './defaults';
import { publicListing } from './public-listing';
export async function platformSnapshot(user: Profile) {
  const [
    leads,
    listings,
    agents,
    neighborhoods,
    profiles,
    stages,
    links,
    activities,
    conversations,
    messages,
    tasks,
    appointments,
    rules,
    runs,
    notifications,
    templates,
    campaigns,
    consents,
    outbox,
  ] = await Promise.all([
    all('leads', true),
    all('listings', true),
    all('agents', true),
    all('neighborhoods', true),
    all('profiles', true),
    all('pipeline_stages', true),
    all('lead_properties', true),
    all('activities', true),
    all('conversations', true),
    all('conversation_messages', true),
    all('tasks', true),
    all('showing_requests', true),
    all('automation_rules', true),
    all('automation_runs', true),
    all('notifications', true),
    all('message_templates', true),
    all('campaigns', true),
    all('consents', true),
    all('dev_outbox', true),
  ]);
  const ownLeads = leads.filter((l) => canManageLead(user, l)),
    leadIds = new Set(ownLeads.map((l) => l.id)),
    ownListings = listings.filter((l) => canManageListing(user, l)),
    listingIds = new Set(ownListings.map((l) => l.id)),
    ownConversations = conversations.filter((c) => canManageConversation(user, c)),
    conversationIds = new Set(ownConversations.map((c) => c.id));
  const settings = user.role === 'admin' ? await all('site_settings', true) : [];
  return {
    user,
    leads: ownLeads,
    listings: ownListings,
    catalog: listings
      .filter((l) => !l.hidden && l.publication_status === 'published')
      .map(publicListing),
    agents,
    neighborhoods,
    profiles: profiles
      .filter((p) => user.role === 'admin' || p.id === user.id)
      .map(({ id, full_name, email, role, agent_id }) => ({
        id,
        full_name,
        email,
        role,
        agent_id,
      })),
    stages: stages.sort((a, b) => a.sort_order - b.sort_order),
    links: links.filter((l) => leadIds.has(l.lead_id)),
    activities: activities
      .filter(
        (a) =>
          user.role === 'admin' ||
          (a.lead_id && leadIds.has(a.lead_id)) ||
          (!a.lead_id && a.listing_id && listingIds.has(a.listing_id)) ||
          a.actor_id === user.id,
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    conversations: ownConversations,
    messages: messages
      .filter((m) => conversationIds.has(m.conversation_id))
      .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    tasks: tasks.filter((t) => canManageTask(user, t)),
    appointments: appointments.filter(
      (a) => user.role === 'admin' || a.assigned_to === user.id || leadIds.has(a.lead_id),
    ),
    rules: user.role === 'admin' ? rules : [],
    runs: user.role === 'admin' ? runs : [],
    notifications: notifications.filter((n) => user.role === 'admin' || n.user_id === user.id),
    templates,
    campaigns: user.role === 'admin' ? campaigns : [],
    consents: consents.filter((c) => leadIds.has(c.lead_id)),
    outbox: user.role === 'admin' ? outbox : [],
    settings: {
      lead_capture: settings.find((s) => s.key === 'lead_capture')?.value || defaultCapture,
      assistant: settings.find((s) => s.key === 'assistant')?.value || defaultAssistant,
    },
    integrations: {
      ai: Boolean(process.env.AI_GATEWAY_API_KEY && process.env.AI_GATEWAY_MODEL),
      model: process.env.AI_GATEWAY_MODEL || '',
      email:
        !isMock &&
        isProd &&
        process.env.DELIVERY_MODE === 'live' &&
        Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
      sms:
        !isMock &&
        isProd &&
        process.env.DELIVERY_MODE === 'live' &&
        Boolean(
          process.env.TWILIO_ACCOUNT_SID &&
          process.env.TWILIO_AUTH_TOKEN &&
          process.env.TWILIO_PHONE_NUMBER,
        ),
      google: !isMock && process.env.GOOGLE_OAUTH_ENABLED === 'true',
      demo: isMock,
    },
  };
}
export type PlatformSnapshot = Awaited<ReturnType<typeof platformSnapshot>>;
