'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { PlatformSnapshot } from '@/lib/platform/snapshot';
import { Notifications } from './notifications';
import { calculateMetrics } from '@/lib/platform/metrics';
import { centralToUtc } from '@/lib/time';
import { WorkspaceHeading, MiniMetric } from './shared';
export function AnalyticsDashboard({
  data,
  overview = false,
}: {
  data: PlatformSnapshot;
  overview?: boolean;
}) {
  const [range, setRange] = useState('30'),
    [from, setFrom] = useState(''),
    [to, setTo] = useState('');
  const start =
      range === 'custom'
        ? from
          ? centralToUtc(from, '00:00')
          : null
        : range === 'all'
          ? null
          : new Date(Date.now() - Number(range) * 86400000).toISOString(),
    end =
      range === 'custom' && to
        ? new Date(Date.parse(centralToUtc(to, '23:59')) + 59000).toISOString()
        : null,
    m = calculateMetrics(data, start, end);
  const upcoming = data.appointments
    .filter(
      (a) => ['requested', 'confirmed'].includes(a.status) && Date.parse(a.starts_at) >= Date.now(),
    )
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .slice(0, 4);
  return (
    <>
      <WorkspaceHeading
        eyebrow={
          overview
            ? 'Local knowledge. Thoughtful connections.'
            : 'A clearer picture of your business'
        }
        title={overview ? 'Your day, thoughtfully arranged.' : 'Analytics & reports'}
        description={
          overview
            ? 'A little perspective on your properties, your people, and what comes next.'
            : 'Real records. Consistent calculations. A useful view of the next opportunity.'
        }
      >
        <select
          aria-label="Report date range"
          className="date-range-select"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="all">All time</option>
          <option value="custom">Custom dates</option>
        </select>
      </WorkspaceHeading>
      {range === 'custom' && (
        <div className="workspace-filters">
          <label>
            From (Central)
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            Through (Central)
            <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
      )}
      <div className="workspace-metrics">
        <MiniMetric
          label="Your property portfolio"
          value={m.totalProperties}
          note={`${m.activeListings} active & published · current inventory`}
        />
        <MiniMetric
          label="New connections"
          value={m.newLeads}
          note="Contacts first captured in this period"
        />
        <MiniMetric
          label="Lead → appointment"
          value={`${m.leadToAppointment.toFixed(1)}%`}
          note={`${m.appointments} non-cancelled appointments in period`}
        />
        <MiniMetric
          label="Follow-ups due"
          value={m.followUpsDue}
          note="Open tasks due now · current workload"
        />
      </div>
      {overview && <Notifications rows={data.notifications} />}
      <div className="overview-layout">
        <section className="workspace-panel">
          <div className="workspace-panel-heading">
            <div>
              <p className="eyebrow">Every connection begins somewhere</p>
              <h2>Where relationships start</h2>
            </div>
            <Link className="text-link" href="/admin/leads">
              Open CRM ↗
            </Link>
          </div>
          {m.sources.length ? (
            <div className="source-chart">
              {m.sources.map(([source, count]) => (
                <div key={source}>
                  <span>{source}</span>
                  <div role="img" aria-label={`${source}: ${count} contacts`}>
                    <i
                      style={{
                        width: `${(count / Math.max(...m.sources.map(([, n]) => n))) * 100}%`,
                      }}
                    />
                  </div>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="workspace-empty compact">
              <h3>A first hello is on its way.</h3>
              <p>Lead sources appear when real inquiries arrive.</p>
            </div>
          )}
          <div className="report-summary">
            <div>
              <span>Qualified contacts</span>
              <strong>{m.qualifiedLeads}</strong>
            </div>
            <div>
              <span>Converted contacts</span>
              <strong>{m.converted}</strong>
            </div>
            <div>
              <span>Lead → conversion</span>
              <strong>{m.leadToConversion.toFixed(1)}%</strong>
            </div>
          </div>
        </section>
        <section className="workspace-panel">
          <div className="workspace-panel-heading">
            <div>
              <p className="eyebrow">Make room for what's next</p>
              <h2>On the calendar</h2>
            </div>
            <Link className="text-link" href="/admin/appointments">
              View schedule ↗
            </Link>
          </div>
          {upcoming.length ? (
            upcoming.map((a) => (
              <div className="calendar-preview" key={a.id}>
                <time>
                  <strong>
                    {new Date(a.starts_at).toLocaleDateString('en-US', {
                      day: 'numeric',
                      timeZone: 'America/Chicago',
                    })}
                  </strong>
                  <span>
                    {new Date(a.starts_at).toLocaleDateString('en-US', {
                      month: 'short',
                      timeZone: 'America/Chicago',
                    })}
                  </span>
                </time>
                <div>
                  <h4>
                    {data.leads.find((l) => l.id === a.lead_id)?.first_name ||
                      'Personal appointment'}
                  </h4>
                  <p>
                    {a.kind.replaceAll('_', ' ')} ·{' '}
                    {new Date(a.starts_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      timeZone: 'America/Chicago',
                    })}{' '}
                    Central
                  </p>
                </div>
                <span className={`status-pill ${a.status}`}>{a.status}</span>
              </div>
            ))
          ) : (
            <div className="workspace-empty compact">
              <h3>A little space for your next connection.</h3>
              <p>New showing requests and consultations will appear here.</p>
              <Link className="text-link" href="/admin/appointments">
                Plan an appointment ↗
              </Link>
            </div>
          )}
        </section>
      </div>
      {overview && <Notifications rows={data.notifications} />}
      <div className="overview-layout">
        <section className="workspace-panel">
          <div className="workspace-panel-heading">
            <div>
              <p className="eyebrow">A closer look at your properties</p>
              <h2>Property interest</h2>
            </div>
            <Link className="text-link" href="/admin/listings">
              Manage inventory ↗
            </Link>
          </div>
          {m.propertyInquiries.length ? (
            m.propertyInquiries.slice(0, 5).map(([id, count]) => (
              <Link href={`/admin/listings/${id}`} key={id} className="workspace-record-link">
                <span>
                  {data.listings.find((l) => l.id === id)?.address_line ||
                    data.catalog.find((l) => l.id === id)?.address_line ||
                    'Property inquiry'}
                </span>
                <strong>{count} inquiries ↗</strong>
              </Link>
            ))
          ) : (
            <p className="muted">No property-specific inquiries in this period.</p>
          )}
          <div className="report-summary">
            <div>
              <span>Recorded property views</span>
              <strong>{m.views}</strong>
            </div>
            <div>
              <span>Chat conversations</span>
              <strong>{m.conversations}</strong>
            </div>
            <div>
              <span>Chat-linked contacts</span>
              <strong>{m.chatLeads}</strong>
            </div>
          </div>
          <p className="demo-note">
            View counts require visitor analytics consent. No synthetic traffic is added.
          </p>
        </section>
        <section className="workspace-panel">
          <div className="workspace-panel-heading">
            <div>
              <p className="eyebrow">Thoughtful follow-through</p>
              <h2>{overview ? 'Recent activity' : 'Team workload'}</h2>
            </div>
          </div>
          {overview ? (
            <div className="activity-timeline compact">
              {data.activities.slice(0, 6).map((a) => (
                <div key={a.id}>
                  <span />
                  <section>
                    <strong>{a.kind.replaceAll('_', ' ')}</strong>
                    <p>{a.body}</p>
                    <small>{new Date(a.created_at).toLocaleString()}</small>
                  </section>
                </div>
              ))}
              {data.activities.length === 0 && (
                <p className="muted">Your workspace activity will appear as records change.</p>
              )}
            </div>
          ) : (
            data.profiles
              .filter((p) => p.role !== 'user')
              .map((p) => (
                <div className="workspace-record-link" key={p.id}>
                  <span>{p.full_name || p.email}</span>
                  <strong>
                    {
                      data.leads.filter((l) => l.assigned_to === p.id && l.status !== 'closed')
                        .length
                    }{' '}
                    open contacts ·{' '}
                    {data.tasks.filter((t) => t.assigned_to === p.id && t.status === 'open').length}{' '}
                    tasks
                  </strong>
                </div>
              ))
          )}
        </section>
      </div>
      {!overview && (
        <section className="workspace-panel">
          <h2>How these numbers are calculated</h2>
          <p className="muted mt-8">
            The date range selects contacts by creation time and appointments by their scheduled
            start. Conversion rates use that contact cohort and its current pipeline outcome; they
            are not historical snapshots. Qualified contacts are in open/won stages from the third
            stage onward. Cancelled appointments are excluded. Inventory and follow-ups due describe
            the current workspace. All figures come from records you are permitted to access.
          </p>
          <p className="demo-note">
            The catalog is a fictional prototype. Contact, appointment, activity, and conversion
            counts reflect actual interactions with this workspace. No production analytics are
            invented.
          </p>
        </section>
      )}
    </>
  );
}
