import 'server-only';
import { base, mutateStore, all } from '@/lib/repository';
import { serviceClient } from '@/lib/supabase/server';
import { isMock } from '@/lib/env';
import type { LeadData } from '@/lib/schemas';
import type { Consent, Lead, Showing, Valuation, Outbox } from '@/lib/types';
import { CONSENT_VERSION, consentRecords } from '@/lib/consent';
import { getListings } from '@/lib/data';
import { estimateValue } from '@/lib/valuation';
import { showingIcs } from '@/lib/calendar';
import { ApiError } from '@/lib/security';
import { deliver } from '@/lib/email';
import { STAGE_IDS, normalizeEmail, normalizePhone } from '@/lib/platform/defaults';
import { mergeInquiry } from '@/lib/platform/inquiries';
import { runAutomations } from '@/lib/platform/automations';
export async function captureLead(
  data: LeadData,
  meta: { ip_hash: string; user_agent: string },
  assignedTo: string | null = null,
) {
  const lead: Lead = {
    ...base(),
    source: data.source,
    first_name: data.first_name,
    middle_name: data.middle_name,
    last_name: data.last_name,
    email: normalizeEmail(data.email),
    phone: normalizePhone(data.phone),
    interest: data.interest,
    message: data.message,
    listing_id: data.listing_id,
    agent_id: data.agent_id,
    trigger_source: data.trigger_source,
    utm: data.utm,
    ...meta,
    status: 'new',
    assigned_to: assignedTo,
    notes: '',
    stage_id: STAGE_IDS[0],
    priority: 'normal',
    tags: [],
    follow_up_at: null,
    last_interaction_at: new Date().toISOString(),
  };
  const consents: Consent[] = consentRecords(data.email_phone, data.sms, data.newsletter).map(
    (c) => ({
      ...base(),
      lead_id: lead.id,
      ...c,
      disclosure_version: CONSENT_VERSION,
      ...meta,
      granted_at: new Date().toISOString(),
    }),
  );
  const listings = await getListings();
  let showing: Showing | null = null,
    valuation: Valuation | null = null;
  if (data.listing_id && !listings.some((l) => l.id === data.listing_id))
    throw new ApiError(400, 'This property is no longer available.');
  if (data.source === 'showing') {
    const date = new Date(data.starts_at),
      diff = date.getTime() - Date.now();
    if (
      !Number.isFinite(diff) ||
      diff < 0 ||
      diff > 15 * 86400000 ||
      date.getUTCMinutes() % 30 !== 0
    )
      throw new ApiError(400, 'Choose a 30-minute appointment in the next 14 days.');
    showing = {
      ...base(),
      listing_id: data.listing_id!,
      lead_id: lead.id,
      starts_at: date.toISOString(),
      ends_at: new Date(date.getTime() + 1800000).toISOString(),
      meeting_type: data.meeting_type,
      status: 'requested',
      kind: 'tour',
      assigned_to: null,
      notes: '',
    };
  }
  if (data.source === 'valuation') {
    const found = listings.find((l) =>
      data.address.toLowerCase().includes(l.address_line.toLowerCase()),
    );
    const result = found
      ? estimateValue(
          {
            lat: found.lat,
            lng: found.lng,
            beds: data.beds,
            baths: data.baths,
            sqft: data.sqft,
            property_type: data.property_type,
          },
          listings,
        )
      : {
          low: 0,
          mid: 0,
          high: 0,
          confidence: 'low' as const,
          comps: [],
          method:
            'Address requires verified geocoding. We will prepare a manual comparative market analysis.',
          manual: true,
        };
    valuation = {
      ...base(),
      lead_id: lead.id,
      address: data.address,
      lat: found?.lat ?? null,
      lng: found?.lng ?? null,
      result,
      confidence: result.confidence,
    };
  }
  const listing = listings.find((l) => l.id === data.listing_id);
  const attachments = showing
    ? [
        {
          filename: 'showing-request.ics',
          content: showingIcs({
            id: showing.id,
            starts_at: showing.starts_at,
            address: listing!.address_line,
            meeting_type: showing.meeting_type,
          }),
        },
      ]
    : [];
  const outbox: Outbox[] = [
    {
      ...base(),
      channel: 'email',
      recipient: process.env.LEADS_NOTIFY_EMAIL || 'team@example.invalid',
      subject: `New ${data.source} inquiry`,
      body: `${lead.first_name} ${lead.last_name}\n${lead.email}\n${lead.phone}\n${lead.message}\n${data.address}\n${listing?.address_line || ''}`,
      attachments,
      sent_at: null,
    },
  ];
  if (showing)
    outbox.push({
      ...base(),
      channel: 'email',
      recipient: lead.email,
      subject: 'Your showing request is with our team',
      body: `Thank you for your interest in ${listing!.address_line}. We are reviewing your request and will be in touch shortly!\nYour requested time: ${new Date(showing.starts_at).toLocaleString('en-US', { timeZone: 'America/Chicago' })} (Central Time). This appointment is tentative.`,
      attachments,
      sent_at: null,
    });
  let canonical = lead,
    created = false;
  if (isMock) {
    const result = await mutateStore((store) =>
      mergeInquiry(
        store,
        { lead, consents, showing, valuation, outbox, newsletter: data.newsletter },
        base,
      ),
    );
    canonical = result.lead;
    created = result.created;
  } else {
    const { data: id, error } = await serviceClient().rpc('submit_lead_bundle', {
      payload: { lead, consents, showing, valuation, outbox, newsletter: data.newsletter },
    });
    if (error) throw new Error(error.message);
    created = id === lead.id;
    canonical = (await all('leads', true)).find((l) => l.id === id)!;
  }
  await Promise.allSettled([
    ...outbox.map(deliver),
    runAutomations(
      created ? 'lead_created' : 'inquiry_submitted',
      canonical,
      created ? `lead:${canonical.id}` : `inquiry:${lead.id}`,
    ),
    ...(showing
      ? [runAutomations('appointment_scheduled', canonical, `appointment:${showing.id}`)]
      : []),
  ]);
  return {
    lead_id: canonical.id,
    showing: showing ? { ...showing, lead_id: canonical.id } : null,
    valuation: valuation ? { ...valuation, lead_id: canonical.id } : null,
  };
}
