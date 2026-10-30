import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import seed from '@/supabase/seed/data.json';
import { normalizeStore, normalizeEmail, normalizePhone, STAGE_IDS } from '@/lib/platform/defaults';
import { mergeInquiry } from '@/lib/platform/inquiries';
import { listingInput, appointmentInput, captureInput } from '@/lib/platform/schemas';
import { validListingTransition } from '@/lib/platform/lifecycle';
import { canManageLead, canManageListing, canManageConversation } from '@/lib/platform/permissions';
import { publicListing } from '@/lib/platform/public-listing';
import { filterListings } from '@/lib/search';
import { leadSchema } from '@/lib/schemas';
import { isPhone } from '@/lib/contact-details';
import type { Lead, Profile } from '@/lib/types';
const base = () => ({
  id: randomUUID(),
  created_at: '2026-10-29T12:00:00.000Z',
  updated_at: '2026-10-29T12:00:00.000Z',
});
const lead = (email: string, listing_id: string): Lead => ({
  ...base(),
  source: 'contact',
  first_name: 'Avery',
  middle_name: '',
  last_name: 'Taylor',
  email,
  phone: '+15015550101',
  interest: 'Buying',
  message: 'A thoughtful place to begin.',
  listing_id,
  agent_id: null,
  trigger_source: '/properties/a-home',
  utm: { utm_campaign: 'autumn' },
  ip_hash: 'hash',
  user_agent: 'unit-test',
  status: 'new',
  assigned_to: null,
  notes: '',
  stage_id: STAGE_IDS[0],
  priority: 'normal',
  tags: [],
  follow_up_at: null,
  last_interaction_at: null,
});
describe('lead identity and history', () => {
  it('rejects empty formatting as a phone number and strips authentication-shaped attribution keys', () => {
    expect(isPhone('-------')).toBe(false);
    expect(isPhone('(501) 555-0101')).toBe(true);
    expect(isPhone('+44 20 7946 0000')).toBe(true);
    const parsed = leadSchema.parse({
      source: 'contact',
      first_name: 'Avery',
      email: 'a@example.com',
      utm: { utm_source: 'newsletter', access_token: 'DO-NOT-STORE', password: 'DO-NOT-STORE' },
    });
    expect(parsed.utm).toEqual({ utm_source: 'newsletter' });
  });
  it('normalizes identity without weakening email or phone distinctions', () => {
    expect(normalizeEmail(' Avery@EXAMPLE.COM ')).toBe('avery@example.com');
    expect(normalizePhone('(501) 555-0101')).toBe('+15015550101');
    expect(normalizePhone('+44 20 7946 0000')).toBe('+442079460000');
  });
  it('merges repeated inquiries across properties while preserving assignment, pipeline and immutable consent history', () => {
    const store = normalizeStore(seed),
      first = lead('Avery@Example.com', store.listings[0].id),
      second = lead(' avery@example.COM ', store.listings[1].id),
      staff = randomUUID();
    const consent = {
      ...base(),
      lead_id: first.id,
      channel: 'sms' as const,
      granted: true,
      disclosure_text: 'Original choice',
      disclosure_version: 'v1',
      ip_hash: 'h',
      user_agent: 't',
      granted_at: base().created_at,
    };
    mergeInquiry(
      store,
      {
        lead: first,
        consents: [consent],
        showing: null,
        valuation: null,
        outbox: [],
        newsletter: false,
      },
      base,
    );
    store.leads.find((l) => l.id === first.id)!.assigned_to = staff;
    store.leads.find((l) => l.id === first.id)!.stage_id = STAGE_IDS[2];
    const snapshot = structuredClone(store.consents[0]);
    const result = mergeInquiry(
      store,
      {
        lead: second,
        consents: [{ ...consent, id: randomUUID(), granted: false }],
        showing: null,
        valuation: null,
        outbox: [],
        newsletter: false,
      },
      base,
    );
    expect(result.created).toBe(false);
    expect(result.lead.id).toBe(first.id);
    expect(store.leads.filter((l) => normalizeEmail(l.email) === 'avery@example.com')).toHaveLength(
      1,
    );
    expect(result.lead.assigned_to).toBe(staff);
    expect(result.lead.stage_id).toBe(STAGE_IDS[2]);
    expect(store.lead_properties.filter((p) => p.lead_id === first.id)).toHaveLength(2);
    expect(store.consents[0]).toEqual(snapshot);
    expect(store.consents.filter((c) => c.lead_id === first.id)).toHaveLength(2);
    expect(store.activities.filter((a) => a.lead_id === first.id).map((a) => a.kind)).toEqual([
      'lead_created',
      'inquiry_submitted',
    ]);
  });
});
describe('validated real estate workflows', () => {
  it('keeps the existing public search filters while removing private feed payloads', () => {
    const l = normalizeStore(seed).listings[0],
      dto = publicListing({
        ...l,
        raw: { ...l.raw, private_note: 'PRIVATE-FEED-NOTE', pool: true, garage: 2, hoa: 40 },
      });
    expect(JSON.stringify(dto)).not.toContain('PRIVATE-FEED-NOTE');
    expect(filterListings([dto], { pool: true, garage: true, hoa: 50 })).toHaveLength(1);
    expect(filterListings([dto], { hoa: 20 })).toHaveLength(0);
  });
  it('prevents a closed transaction from silently reopening', () => {
    expect(validListingTransition('for_sale', 'pending')).toBe(true);
    expect(validListingTransition('pending', 'sold')).toBe(true);
    expect(validListingTransition('sold', 'for_sale')).toBe(false);
  });
  it('requires a real photo and price before publishing, and closing details for sold properties', () => {
    const row = normalizeStore(seed).listings[0];
    expect(listingInput.safeParse({ ...row, listing_photos: [] }).success).toBe(false);
    expect(
      listingInput.safeParse({ ...row, list_price: 0, publication_status: 'published' }).success,
    ).toBe(false);
    expect(
      listingInput.safeParse({ ...row, status: 'sold', sold_price: null, sold_date: null }).success,
    ).toBe(false);
    expect(listingInput.safeParse(row).success).toBe(true);
  });
  it('rejects backwards appointments and tours without a property', () => {
    const value = {
      lead_id: randomUUID(),
      listing_id: null,
      starts_at: '2026-11-01T15:00:00Z',
      ends_at: '2026-11-01T14:00:00Z',
      meeting_type: 'in_person',
      kind: 'tour',
      assigned_to: null,
      status: 'requested',
      notes: '',
    };
    expect(appointmentInput.safeParse(value).success).toBe(false);
    expect(
      appointmentInput.safeParse({
        ...value,
        kind: 'buyer_consultation',
        ends_at: '2026-11-01T16:00:00Z',
      }).success,
    ).toBe(true);
    expect(
      captureInput.safeParse({ ...captureInput.parse(undefined), required_fields: ['phone'] })
        .success,
    ).toBe(false);
  });
});
describe('assignment boundaries', () => {
  const agent = {
    ...base(),
    email: 'agent@example.com',
    full_name: 'Agent',
    phone: '',
    notification_prefs: {},
    role: 'agent',
    agent_id: randomUUID(),
  } as Profile;
  it('scopes private contacts, properties and conversations to the assigned agent', () => {
    const row = lead('a@example.com', randomUUID());
    expect(canManageLead(agent, row)).toBe(false);
    expect(canManageLead(agent, { ...row, assigned_to: agent.id })).toBe(true);
    expect(
      canManageListing(agent, {
        ...normalizeStore(seed).listings[0],
        listing_agent_id: agent.agent_id!,
      }),
    ).toBe(true);
    expect(
      canManageConversation(agent, { assigned_to: randomUUID() } as Parameters<
        typeof canManageConversation
      >[1]),
    ).toBe(false);
  });
});
