import { describe, it, expect } from 'vitest';
import seed from '@/supabase/seed/data.json';
import { normalizeStore, STAGE_IDS } from '@/lib/platform/defaults';
import { calculateMetrics } from '@/lib/platform/metrics';
import { centralToUtc } from '@/lib/time';
import type { Lead, Showing } from '@/lib/types';
describe('Central time and report calculations', () => {
  it('handles the office timezone in winter, summer and across the daylight-saving boundary', () => {
    expect(centralToUtc('2026-01-15', '10:00')).toBe('2026-01-15T16:00:00.000Z');
    expect(centralToUtc('2026-07-15', '10:00')).toBe('2026-07-15T15:00:00.000Z');
    expect(centralToUtc('2026-11-01', '09:00')).toBe('2026-11-01T15:00:00.000Z');
  });
  it('uses a real contact cohort and distinct contacts for conversion, excludes cancelled appointments and bounds dates', () => {
    const store = normalizeStore(seed);
    const leads = [
      { id: 'a', created_at: '2026-10-20T00:00:00Z', source: 'contact', stage_id: STAGE_IDS[5] },
      { id: 'b', created_at: '2026-10-21T00:00:00Z', source: 'agent', stage_id: STAGE_IDS[2] },
      { id: 'c', created_at: '2026-08-01T00:00:00Z', source: 'contact', stage_id: STAGE_IDS[0] },
    ] as Lead[];
    const appointments = [
      { lead_id: 'a', starts_at: '2026-10-22T00:00:00Z', status: 'confirmed' },
      { lead_id: 'a', starts_at: '2026-10-23T00:00:00Z', status: 'completed' },
      { lead_id: 'b', starts_at: '2026-10-24T00:00:00Z', status: 'cancelled' },
    ] as Showing[];
    const result = calculateMetrics(
      {
        leads,
        listings: store.listings,
        appointments,
        stages: store.pipeline_stages,
        activities: [],
        conversations: [],
        tasks: [],
      },
      '2026-10-01T00:00:00Z',
      '2026-10-31T23:59:59Z',
    );
    expect(result.newLeads).toBe(2);
    expect(result.appointments).toBe(2);
    expect(result.leadToAppointment).toBe(50);
    expect(result.leadToConversion).toBe(50);
    expect(result.qualifiedLeads).toBe(2);
    expect(result.views).toBe(0);
    expect(result.sources).toEqual([
      ['contact', 1],
      ['agent', 1],
    ]);
  });
  it('returns zero conversion rates for an empty cohort', () => {
    const s = normalizeStore(seed),
      m = calculateMetrics({
        leads: [],
        listings: s.listings,
        appointments: [],
        stages: s.pipeline_stages,
        activities: [],
        conversations: [],
        tasks: [],
      });
    expect(m.leadToConversion).toBe(0);
    expect(m.leadToAppointment).toBe(0);
    expect(m.chatLeads).toBe(0);
  });
});
