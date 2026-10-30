import type { Store, Lead, Consent, Showing, Valuation, Outbox, Base } from '@/lib/types';
import { normalizeEmail } from './defaults';
type Inquiry = {
  lead: Lead;
  consents: Consent[];
  showing: Showing | null;
  valuation: Valuation | null;
  outbox: Outbox[];
  newsletter: boolean;
};
export function mergeInquiry(store: Store, bundle: Inquiry, makeBase: () => Base) {
  const { lead } = bundle;
  const identity = store.lead_identities.find(
    (i) => i.normalized_email === normalizeEmail(lead.email),
  );
  const existing = identity
    ? store.leads.find((l) => l.id === identity.lead_id)
    : store.leads.find((l) => normalizeEmail(l.email) === normalizeEmail(lead.email));
  const created = !existing;
  let canonical: Lead;
  if (existing) {
    canonical = {
      ...existing,
      first_name: lead.first_name || existing.first_name,
      last_name: lead.last_name || existing.last_name,
      phone: lead.phone || existing.phone,
      updated_at: lead.created_at,
      last_interaction_at: lead.created_at,
    };
    store.leads[store.leads.indexOf(existing)] = canonical;
  } else {
    canonical = lead;
    store.leads.push(canonical);
    store.lead_identities.push({
      ...makeBase(),
      normalized_email: normalizeEmail(lead.email),
      lead_id: lead.id,
    });
  }
  const id = canonical.id;
  store.consents.push(...bundle.consents.map((c) => ({ ...c, lead_id: id })));
  if (
    lead.listing_id &&
    !store.lead_properties.some((p) => p.lead_id === id && p.listing_id === lead.listing_id)
  )
    store.lead_properties.push({
      ...makeBase(),
      lead_id: id,
      listing_id: lead.listing_id,
      source_page: lead.trigger_source,
    });
  if (bundle.showing)
    store.showing_requests.push({
      ...bundle.showing,
      lead_id: id,
      assigned_to: canonical.assigned_to,
    });
  if (bundle.valuation) store.valuation_requests.push({ ...bundle.valuation, lead_id: id });
  if (
    bundle.newsletter &&
    !store.newsletter_subscribers.some(
      (s) => normalizeEmail(s.email) === normalizeEmail(lead.email),
    )
  )
    store.newsletter_subscribers.push({
      ...makeBase(),
      email: normalizeEmail(lead.email),
      status: 'active',
      confirmed_at: null,
    });
  store.dev_outbox.push(...bundle.outbox);
  const activity = {
    ...makeBase(),
    lead_id: id,
    listing_id: lead.listing_id,
    conversation_id: null,
    actor_id: null,
    kind: created ? 'lead_created' : 'inquiry_submitted',
    body: `Inquiry received from ${lead.source}`,
    payload: { source: lead.source, utm: lead.utm, message: lead.message },
    is_internal: true,
  };
  store.activities.push(activity);
  return { lead: canonical, created, activity_id: activity.id };
}
