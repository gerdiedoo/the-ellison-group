import type { Store, Lead, Listing, Profile, Showing } from '@/lib/types';
import type { PipelineStage, CaptureConfig, AssistantConfig } from './types';
export const STAGE_IDS = [
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000004',
  '10000000-0000-4000-8000-000000000005',
  '10000000-0000-4000-8000-000000000006',
  '10000000-0000-4000-8000-000000000007',
];
const timestamp = '2026-10-29T00:00:00.000Z';
export const defaultStages: PipelineStage[] = [
  'New',
  'Contacted',
  'Qualified',
  'Appointment Scheduled',
  'Active Opportunity',
  'Converted',
  'Lost',
].map((name, i) => ({
  id: STAGE_IDS[i],
  created_at: timestamp,
  updated_at: timestamp,
  name,
  sort_order: i,
  outcome: i === 5 ? 'won' : i === 6 ? 'lost' : 'open',
  color: ['#8b1e2d', '#977247', '#53694c', '#426773', '#776786', '#2f6b4f', '#68675f'][i],
}));
export const defaultCapture: CaptureConfig = {
  enabled: false,
  property_ids: [],
  detail_mode: 'action',
  allow_basic_browsing: true,
  actions: [],
  required_fields: ['full_name', 'email', 'phone'],
  google_enabled: false,
};
export const defaultAssistant: AssistantConfig = {
  enabled: true,
  instructions:
    'Be concise, warm, and helpful. Use only the supplied public property records. Offer human assistance when needed.',
  approved_faq:
    'The Ellison Group serves Little Rock, Arkansas. Office: 12814 Cantrell Rd, Little Rock AR 72223. Phone: (501) 725-1227. Showing requests require team confirmation.',
};
export const platformTableNames = [
  'pipeline_stages',
  'lead_properties',
  'activities',
  'conversations',
  'conversation_messages',
  'tasks',
  'automation_rules',
  'automation_runs',
  'notifications',
  'message_templates',
  'campaigns',
  'lead_identities',
] as const;
export function normalizeStore(value: unknown): Store {
  const store = structuredClone(value) as Store;
  for (const table of platformTableNames)
    if (!store[table])
      (store as unknown as Record<string, unknown>)[table] =
        table === 'pipeline_stages' ? structuredClone(defaultStages) : [];
  store.listings = store.listings.map(
    (l) =>
      Object.assign(
        {
          publication_status: l.hidden ? 'archived' : 'published',
          listing_kind: 'sale',
          title: l.address_line,
          mls_id_locked: true,
          lead_capture_required: false,
        },
        l,
      ) as Listing,
  );
  store.leads = store.leads.map(
    (l) =>
      Object.assign(
        {
          stage_id:
            l.status === 'contacted'
              ? STAGE_IDS[1]
              : l.status === 'closed'
                ? STAGE_IDS[5]
                : STAGE_IDS[0],
          priority: 'normal',
          tags: [],
          follow_up_at: null,
          last_interaction_at: l.updated_at,
        },
        l,
      ) as Lead,
  );
  store.profiles = store.profiles.map((p) => Object.assign({ agent_id: null }, p) as Profile);
  store.showing_requests = store.showing_requests.map(
    (s) =>
      Object.assign(
        {
          kind: 'tour',
          assigned_to: null,
          notes: '',
          ends_at: new Date(new Date(s.starts_at).getTime() + 1800000).toISOString(),
        },
        s,
      ) as Showing,
  );
  for (const lead of store.leads)
    if (!store.lead_identities.some((i) => i.normalized_email === normalizeEmail(lead.email)))
      store.lead_identities.push({
        id: lead.id,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
        normalized_email: normalizeEmail(lead.email),
        lead_id: lead.id,
      });
  return store;
}
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const normalizePhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 ? `+1${digits}` : digits ? `+${digits}` : '';
};
