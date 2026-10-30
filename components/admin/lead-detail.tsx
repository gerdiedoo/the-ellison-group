'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Lead } from '@/lib/types';
import type { PlatformSnapshot } from '@/lib/platform/snapshot';
import { initials } from '@/lib/utils';
import { centralDate, centralToUtc, OFFICE_ZONE } from '@/lib/time';
import { WorkspaceHeading, Feedback, useCommand, SubmitButton } from './shared';
export function centralInput(iso: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: OFFICE_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
  return `${centralDate(date)}T${time}`;
}
export const fromCentralInput = (value: string) =>
  value ? centralToUtc(value.slice(0, 10), value.slice(11, 16)) : null;
export function LeadDetail({ data, lead: l }: { data: PlatformSnapshot; lead: Lead }) {
  const [tab, setTab] = useState('Overview');
  const command = useCommand(),
    properties = data.links
      .filter((p) => p.lead_id === l.id)
      .map(
        (p) =>
          data.catalog.find((x) => x.id === p.listing_id) ||
          data.listings.find((x) => x.id === p.listing_id),
      )
      .filter(Boolean),
    events = data.activities.filter((a) => a.lead_id === l.id),
    conversations = data.conversations.filter((c) => c.lead_id === l.id),
    tasks = data.tasks.filter((t) => t.lead_id === l.id);
  return (
    <>
      <WorkspaceHeading
        eyebrow="A relationship, thoughtfully understood"
        title={l.first_name ? `${l.first_name} ${l.last_name}` : l.email}
        description={`${l.email} · ${l.source} · first connected ${new Date(l.created_at).toLocaleDateString()}`}
      >
        <Link className="text-link" href="/admin/leads">
          Back to CRM
        </Link>
        <Link className="button button-outline" href={`/admin/appointments?lead=${l.id}`}>
          Plan an appointment ↗
        </Link>
      </WorkspaceHeading>
      <div className="lead-detail-layout">
        <div>
          <section className="workspace-panel">
            <div className="lead-profile-heading">
              <span className="contact-initials large">
                {initials(l.first_name ? `${l.first_name} ${l.last_name}` : l.email)}
              </span>
              <div>
                <h2>{l.first_name ? `${l.first_name} ${l.last_name}` : 'Your new connection'}</h2>
                <p>{l.phone || 'Phone details not yet provided'}</p>
              </div>
              <span className={`status-pill ${l.priority}`}>{l.priority} priority</span>
            </div>
            <div className="workspace-tabs" role="tablist" aria-label="Contact details">
              {['Overview', 'Activity', 'Properties', 'Communication', 'Consent history'].map(
                (t) => (
                  <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
                    {t}
                  </button>
                ),
              )}
            </div>
            {tab === 'Overview' ? (
              <form
                className="form"
                key={l.updated_at}
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  await command.run(
                    'lead_save',
                    {
                      first_name: f.get('first_name'),
                      last_name: f.get('last_name'),
                      email: f.get('email'),
                      phone: f.get('phone'),
                      stage_id: f.get('stage_id'),
                      assigned_to: f.get('assigned_to') || null,
                      priority: f.get('priority'),
                      tags: String(f.get('tags') || '')
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                      follow_up_at: fromCentralInput(String(f.get('follow_up_at') || '')),
                    },
                    l.id,
                  );
                }}
              >
                <div className="form-row">
                  <label>
                    First name
                    <input name="first_name" defaultValue={l.first_name} />
                  </label>
                  <label>
                    Last name
                    <input name="last_name" defaultValue={l.last_name} />
                  </label>
                  <label>
                    Email
                    <input name="email" type="email" defaultValue={l.email} required />
                  </label>
                  <label>
                    Phone
                    <input name="phone" type="tel" defaultValue={l.phone} />
                  </label>
                  <label>
                    Pipeline stage
                    <select name="stage_id" defaultValue={l.stage_id}>
                      {data.stages.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Priority
                    <select name="priority" defaultValue={l.priority}>
                      {['low', 'normal', 'high'].map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Assigned staff
                    <select name="assigned_to" defaultValue={l.assigned_to || ''}>
                      {data.user.role === 'admin' && <option value="">Unassigned</option>}
                      {data.profiles
                        .filter((p) => p.role !== 'user')
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.full_name || p.email}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    Follow-up date & time (Central)
                    <input
                      name="follow_up_at"
                      type="datetime-local"
                      defaultValue={centralInput(l.follow_up_at)}
                    />
                  </label>
                </div>
                <label>
                  Tags, separated by commas
                  <input
                    name="tags"
                    defaultValue={l.tags.join(', ')}
                    placeholder="First-time buyer, Hillcrest, autumn move"
                  />
                </label>
                <Feedback {...command} />
                <SubmitButton busy={command.busy} />
              </form>
            ) : tab === 'Activity' ? (
              <>
                <form
                  className="form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget,
                      f = new FormData(form),
                      r = await command.run('activity_note', {
                        lead_id: l.id,
                        listing_id: null,
                        body: f.get('body'),
                      });
                    if (r.ok) form.reset();
                  }}
                >
                  <label>
                    Add a personal note
                    <textarea
                      name="body"
                      required
                      placeholder="A little context for the next conversation."
                    />
                  </label>
                  <SubmitButton busy={command.busy} label="Add internal note" />
                  <Feedback {...command} />
                </form>
                <div className="activity-timeline">
                  {events.map((a) => (
                    <div key={a.id}>
                      <span />
                      <section>
                        <strong>
                          {a.kind === 'manual_note' ? 'Personal note' : a.kind.replaceAll('_', ' ')}
                        </strong>
                        <p>{a.body}</p>
                        {a.payload &&
                          typeof a.payload === 'object' &&
                          !Array.isArray(a.payload) &&
                          typeof a.payload.message === 'string' && <p>{a.payload.message}</p>}
                        <small>
                          {a.actor_id
                            ? data.profiles.find((p) => p.id === a.actor_id)?.full_name || 'Staff'
                            : 'System'}{' '}
                          · {new Date(a.created_at).toLocaleString()}
                        </small>
                      </section>
                    </div>
                  ))}
                </div>
              </>
            ) : tab === 'Properties' ? (
              <div>
                {properties.map(
                  (p) =>
                    p && (
                      <Link
                        href={`/admin/listings/${p.id}`}
                        key={p.id}
                        className="workspace-record-link"
                      >
                        <strong>{p.address_line}</strong>
                        <span>
                          {p.city} · {p.status.replaceAll('_', ' ')} ↗
                        </span>
                      </Link>
                    ),
                )}
                {properties.length === 0 && (
                  <div className="workspace-empty">
                    <h3>A home is still taking shape.</h3>
                    <p>Property inquiries automatically build this collection.</p>
                  </div>
                )}
              </div>
            ) : tab === 'Communication' ? (
              <>
                <p className="muted">
                  Messages stay linked to their conversation. Human replies appear in the visitor's
                  chat; external email and SMS require a configured provider and recorded consent.
                </p>
                {conversations.map((c) => (
                  <Link
                    key={c.id}
                    className="workspace-record-link"
                    href={`/admin/conversations/${c.id}`}
                  >
                    <span>
                      {c.mode === 'ai' ? 'AI-assisted' : 'Human-handled'} conversation · {c.status}
                    </span>
                    <strong>Open conversation ↗</strong>
                  </Link>
                ))}
                <Link className="text-link mt-8" href={`/admin/communications?lead=${l.id}`}>
                  Open communication center ↗
                </Link>
              </>
            ) : (
              <div className="table-wrap">
                <table className="workspace-table consent-table">
                  <thead>
                    <tr>
                      <th>Channel</th>
                      <th>Choice</th>
                      <th>When</th>
                      <th>Notice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.consents
                      .filter((c) => c.lead_id === l.id)
                      .sort((a, b) => b.granted_at.localeCompare(a.granted_at))
                      .map((c) => (
                        <tr key={c.id}>
                          <td>{c.channel.replaceAll('_', ' / ')}</td>
                          <td>{c.granted ? 'Opted in' : 'Not granted'}</td>
                          <td>{new Date(c.granted_at).toLocaleString()}</td>
                          <td>
                            <details>
                              <summary>{c.disclosure_version}</summary>
                              <p>{c.disclosure_text}</p>
                            </details>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
        <aside>
          <section className="workspace-panel">
            <p className="eyebrow">The next thoughtful step</p>
            <h3>Follow-ups</h3>
            {tasks
              .filter((t) => t.status === 'open')
              .map((t) => (
                <Link
                  className="workspace-record-link"
                  href={`/admin/tasks?lead=${l.id}`}
                  key={t.id}
                >
                  <span>{t.title}</span>
                  <small>
                    {t.due_at ? new Date(t.due_at).toLocaleDateString() : 'No due date'}
                  </small>
                </Link>
              ))}
            {tasks.filter((t) => t.status === 'open').length === 0 && (
              <p className="muted mt-8">A little room to plan the next conversation.</p>
            )}
            <Link className="text-link mt-8" href={`/admin/tasks?lead=${l.id}`}>
              Manage follow-ups ↗
            </Link>
          </section>
          <section className="workspace-panel">
            <p className="eyebrow">Connection details</p>
            <div className="context-stat">
              <span>First touch</span>
              <strong className="small-value">{l.source}</strong>
            </div>
            <div className="context-stat">
              <span>Campaign</span>
              <strong className="small-value">
                {l.utm.utm_campaign || 'Direct / not provided'}
              </strong>
            </div>
            <div className="context-stat">
              <span>Last interaction</span>
              <strong className="small-value">
                {l.last_interaction_at ? new Date(l.last_interaction_at).toLocaleDateString() : '—'}
              </strong>
            </div>
            <div className="context-stat">
              <span>Appointments</span>
              <strong>{data.appointments.filter((a) => a.lead_id === l.id).length}</strong>
            </div>
            {l.trigger_source && <p className="demo-note">Origin: {l.trigger_source}</p>}
          </section>
          {l.message && (
            <section className="workspace-panel">
              <p className="eyebrow">The first conversation</p>
              <h3>Original inquiry</h3>
              <p className="muted mt-8" style={{ whiteSpace: 'pre-wrap' }}>
                {l.message}
              </p>
            </section>
          )}
          {l.notes && (
            <section className="workspace-panel">
              <p className="eyebrow">Earlier contact context</p>
              <h3>Existing notes</h3>
              <p className="muted mt-8" style={{ whiteSpace: 'pre-wrap' }}>
                {l.notes}
              </p>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
