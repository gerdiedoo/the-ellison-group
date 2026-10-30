import type { Lead, Listing, Showing } from '@/lib/types';
import type { PipelineStage, Activity, Conversation, Task } from './types';
type MetricData = {
  leads: Lead[];
  listings: Listing[];
  appointments: Showing[];
  stages: PipelineStage[];
  activities: Activity[];
  conversations: Conversation[];
  tasks: Task[];
};
export function calculateMetrics(
  data: MetricData,
  from: string | null = null,
  to: string | null = null,
  now = new Date(),
) {
  const within = (value: string) =>
    !from || Date.parse(value) >= Date.parse(from)
      ? !to || Date.parse(value) <= Date.parse(to)
      : false;
  const leads = data.leads.filter((l) => within(l.created_at)),
    ids = new Set(leads.map((l) => l.id)),
    won = new Set(data.stages.filter((s) => s.outcome === 'won').map((s) => s.id)),
    qualified = new Set(
      data.stages.filter((s) => s.outcome !== 'lost' && s.sort_order >= 2).map((s) => s.id),
    );
  const appointments = data.appointments.filter(
      (a) => within(a.starts_at) && a.status !== 'cancelled',
    ),
    appointmentLeads = new Set(
      appointments.filter((a) => ids.has(a.lead_id)).map((a) => a.lead_id),
    );
  const views = data.activities.filter((a) => a.kind === 'property_viewed' && within(a.created_at));
  const sources = Object.entries(
    leads.reduce<Record<string, number>>((out, l) => {
      out[l.source] = (out[l.source] || 0) + 1;
      return out;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const propertyInquiries = Object.entries(
    data.activities
      .filter(
        (a) =>
          a.lead_id &&
          a.listing_id &&
          ['lead_created', 'inquiry_submitted'].includes(a.kind) &&
          within(a.created_at),
      )
      .reduce<Record<string, number>>((out, a) => {
        out[a.listing_id!] = (out[a.listing_id!] || 0) + 1;
        return out;
      }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const converted = leads.filter((l) => won.has(l.stage_id)).length;
  return {
    totalProperties: data.listings.length,
    activeListings: data.listings.filter(
      (l) => l.status === 'for_sale' && l.publication_status === 'published',
    ).length,
    newLeads: leads.length,
    qualifiedLeads: leads.filter((l) => qualified.has(l.stage_id)).length,
    converted,
    leadToAppointment: leads.length ? (appointmentLeads.size / leads.length) * 100 : 0,
    leadToConversion: leads.length ? (converted / leads.length) * 100 : 0,
    appointments: appointments.length,
    sources,
    propertyInquiries,
    views: views.length,
    mostViewed: Object.entries(
      views.reduce<Record<string, number>>((o, a) => {
        if (a.listing_id) o[a.listing_id] = (o[a.listing_id] || 0) + 1;
        return o;
      }, {}),
    ).sort((a, b) => b[1] - a[1]),
    followUpsDue: data.tasks.filter(
      (t) => t.status === 'open' && t.due_at && Date.parse(t.due_at) <= now.getTime(),
    ).length,
    conversations: data.conversations.filter((c) => within(c.created_at)).length,
    chatLeads: data.conversations.filter((c) => c.lead_id && within(c.created_at)).length,
    cohort: leads,
  };
}
