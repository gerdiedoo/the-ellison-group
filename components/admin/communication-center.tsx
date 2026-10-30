'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { PlatformSnapshot } from '@/lib/platform/snapshot';
import { WorkspaceHeading, WorkspaceDialog, Feedback, useCommand, SubmitButton } from './shared';
export function CommunicationCenter({ data }: { data: PlatformSnapshot }) {
  const query = useSearchParams(),
    [leadId, setLeadId] = useState(query.get('lead') || data.leads[0]?.id || ''),
    [channel, setChannel] = useState<'internal' | 'email' | 'sms'>('internal'),
    [body, setBody] = useState(''),
    [subject, setSubject] = useState('A personal note from The Ellison Group'),
    [confirm, setConfirm] = useState(false),
    [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const command = useCommand(),
    lead = data.leads.find((l) => l.id === leadId),
    ready = channel === 'internal' || data.integrations[channel];
  const events = data.activities.filter(
    (a) =>
      a.lead_id === leadId &&
      [
        'lead_created',
        'inquiry_submitted',
        'manual_note',
        'message_sent',
        'internal_note',
        'contact_updated',
      ].includes(a.kind),
  );
  async function send() {
    const result =
      channel === 'internal'
        ? await command.run('activity_note', { lead_id: leadId, listing_id: null, body })
        : await command.run(
            'send_message',
            { lead_id: leadId, channel, subject, body },
            undefined,
            undefined,
            requestId,
          );
    if (result.ok) {
      setBody('');
      setConfirm(false);
      setRequestId(crypto.randomUUID());
    }
  }
  return (
    <>
      <WorkspaceHeading
        eyebrow="Personal attention, in every channel"
        title="Communication center"
        description="Inquiries, internal notes, and provider-backed messages, connected to the people behind them."
      />
      <div className="communication-layout">
        <section className="workspace-panel">
          <h2>A thoughtful message</h2>
          <form
            className="form mt-8"
            onSubmit={(e) => {
              e.preventDefault();
              if (channel === 'internal') void send();
              else setConfirm(true);
            }}
          >
            <label>
              Contact
              <select value={leadId} onChange={(e) => setLeadId(e.target.value)} required>
                <option value="">Choose a contact</option>
                {data.leads.map((l) => (
                  <option value={l.id} key={l.id}>
                    {l.first_name || l.email} {l.last_name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Channel
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as typeof channel)}
              >
                <option value="internal">Internal note · staff only</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
            </label>
            {channel !== 'internal' && (
              <p className="integration-notice">
                {ready
                  ? `${channel.toUpperCase()} provider is configured. Server-side consent is checked before sending.`
                  : `${channel.toUpperCase()} delivery is not configured here. No message will be sent. You can save an internal note or manage templates.`}
              </p>
            )}
            <label>
              Start from an approved template
              <select
                defaultValue=""
                onChange={(e) => {
                  const t = data.templates.find((t) => t.id === e.target.value);
                  if (t) {
                    setSubject(t.subject);
                    setBody(
                      t.body
                        .replaceAll('{{first_name}}', lead?.first_name || 'there')
                        .replaceAll('{{last_name}}', lead?.last_name || ''),
                    );
                  }
                }}
              >
                <option value="">Write personally</option>
                {data.templates
                  .filter((t) => t.channel === channel)
                  .map((t) => (
                    <option value={t.id} key={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </label>
            {channel !== 'internal' && (
              <label>
                To
                <input
                  value={channel === 'email' ? lead?.email || '' : lead?.phone || ''}
                  readOnly
                />
              </label>
            )}
            {channel === 'email' && (
              <label>
                Subject
                <input value={subject} onChange={(e) => setSubject(e.target.value)} required />
              </label>
            )}
            <label>
              {channel === 'internal' ? 'Internal note' : 'Message'}
              <textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={6} />
            </label>
            <Feedback {...command} />
            <SubmitButton
              busy={command.busy || !leadId || !ready}
              label={channel === 'internal' ? 'Save internal note' : 'Review message'}
            />
          </form>
        </section>
        <section className="workspace-panel">
          <div className="workspace-panel-heading">
            <div>
              <p className="eyebrow">Every connection, in context</p>
              <h2>Communication history</h2>
            </div>
            {lead && (
              <Link className="text-link" href={`/admin/leads/${lead.id}`}>
                Open contact ↗
              </Link>
            )}
          </div>
          <div className="activity-timeline">
            {events.map((a) => (
              <div key={a.id}>
                <span />
                <section>
                  <strong>{a.kind.replaceAll('_', ' ')}</strong>
                  <p>{a.body}</p>
                  {typeof a.payload === 'object' &&
                    a.payload &&
                    !Array.isArray(a.payload) &&
                    a.payload.message && <p>{String(a.payload.message)}</p>}
                  <small>
                    {new Date(a.created_at).toLocaleString()} · {a.actor_id ? 'Staff' : 'System'}
                  </small>
                </section>
              </div>
            ))}
          </div>
          {events.length === 0 && (
            <p className="muted">Select a contact to see their recorded communications.</p>
          )}
          {data.conversations
            .filter((c) => c.lead_id === leadId)
            .map((c) => (
              <Link
                className="workspace-record-link"
                key={c.id}
                href={`/admin/conversations/${c.id}`}
              >
                <span>{c.mode === 'human' ? 'Human-handled' : 'AI-assisted'} chat</span>
                <strong>Read conversation ↗</strong>
              </Link>
            ))}
        </section>
      </div>
      {data.user.role === 'admin' && (
        <section className="workspace-panel">
          <div className="workspace-panel-heading">
            <div>
              <p className="eyebrow">Delivery transparency</p>
              <h2>Message outbox</h2>
            </div>
          </div>
          <p className="demo-note">
            Development messages are queued locally. A sent timestamp means provider acceptance, not
            confirmed delivery. Delivery webhooks require provider setup.
          </p>
          <div className="table-wrap mt-8">
            <table className="workspace-table">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Recipient</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Recorded</th>
                </tr>
              </thead>
              <tbody>
                {data.outbox
                  .slice(-20)
                  .reverse()
                  .map((o) => (
                    <tr key={o.id}>
                      <td>{o.channel}</td>
                      <td>{o.recipient}</td>
                      <td>{o.subject}</td>
                      <td>
                        {o.sent_at
                          ? 'Provider accepted'
                          : data.integrations.demo
                            ? 'Local log / not sent'
                            : 'Queued / review required'}
                      </td>
                      <td>{new Date(o.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <WorkspaceDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Send this personal message?"
        description="This uses the configured external provider. The recipient and their recorded channel consent are checked on the server."
      >
        <p>
          <strong>{channel === 'email' ? lead?.email : lead?.phone}</strong>
        </p>
        <p className="mt-8" style={{ whiteSpace: 'pre-wrap' }}>
          {body}
        </p>
        <button className="button mt-8" disabled={command.busy} onClick={send}>
          Send {channel.toUpperCase()}
        </button>
        <Feedback {...command} />
      </WorkspaceDialog>
    </>
  );
}
