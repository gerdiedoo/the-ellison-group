'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MessagesSquare, UserRound } from 'lucide-react';
import type { PlatformSnapshot } from '@/lib/platform/snapshot';
import type { Conversation } from '@/lib/platform/types';
import { WorkspaceHeading, MiniMetric, Feedback, useCommand, SubmitButton } from './shared';
export function Conversations({ data }: { data: PlatformSnapshot }) {
  const [q, setQ] = useState(''),
    [status, setStatus] = useState('all'),
    [mode, setMode] = useState('all'),
    [page, setPage] = useState(1);
  const rows = data.conversations
    .filter((c) => {
      const lead = data.leads.find((l) => l.id === c.lead_id);
      return (
        `${lead?.first_name || ''} ${lead?.email || ''} ${c.summary} ${data.messages
          .filter((m) => m.conversation_id === c.id && !m.is_internal)
          .map((m) => m.body)
          .join(' ')}`
          .toLowerCase()
          .includes(q.toLowerCase()) &&
        (status === 'all' || c.status === status) &&
        (mode === 'all' || c.mode === mode)
      );
    })
    .sort((a, b) => b.last_message_at.localeCompare(a.last_message_at));
  return (
    <>
      <WorkspaceHeading
        eyebrow="The conversation is where it begins"
        title="Conversation inbox"
        description="A clear handoff between helpful technology and a personal connection."
      />
      <div className="workspace-metrics">
        <MiniMetric
          label="Open conversations"
          value={data.conversations.filter((c) => c.status === 'open').length}
        />
        <MiniMetric
          label="Waiting for the team"
          value={data.conversations.filter((c) => c.status === 'waiting').length}
        />
        <MiniMetric
          label="Human-handled"
          value={data.conversations.filter((c) => c.mode === 'human').length}
        />
        <MiniMetric
          label="AI connection"
          value={data.integrations.ai ? 'Configured' : 'Not connected'}
          note={
            data.integrations.ai
              ? data.integrations.model
              : 'Questions can be saved for human follow-up.'
          }
        />
      </div>
      <section className="workspace-panel">
        <div className="workspace-filters">
          <label className="workspace-search">
            <Search size={16} />
            <input
              aria-label="Search conversations"
              placeholder="Search contact or conversation"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <select
            aria-label="Conversation status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Every status</option>
            {['open', 'waiting', 'resolved'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            aria-label="Conversation handling"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">AI & human handling</option>
            <option value="ai">AI handling</option>
            <option value="human">Human handling</option>
          </select>
        </div>
        <div className="conversation-list">
          {rows.slice((page - 1) * 15, page * 15).map((c) => {
            const l = data.leads.find((l) => l.id === c.lead_id),
              latest = data.messages
                .filter((m) => m.conversation_id === c.id && !m.is_internal)
                .at(-1);
            return (
              <Link
                href={`/admin/conversations/${c.id}`}
                className="conversation-preview"
                key={c.id}
              >
                <span className="conversation-icon">
                  {c.mode === 'human' ? <UserRound size={20} /> : <MessagesSquare size={20} />}
                </span>
                <div>
                  <div>
                    <h3>
                      {l?.first_name
                        ? `${l.first_name} ${l.last_name}`
                        : l?.email || 'Website visitor'}
                    </h3>
                    <span className={`status-pill ${c.status}`}>{c.status}</span>
                  </div>
                  <p>{latest?.body || 'A new conversation is ready for your attention.'}</p>
                  <small>
                    {c.mode === 'human' ? 'Human-handled' : 'AI handling'} ·{' '}
                    {new Date(c.last_message_at).toLocaleString()} ·{' '}
                    {data.profiles.find((p) => p.id === c.assigned_to)?.full_name || 'Unassigned'}
                  </small>
                </div>
                <span>↗</span>
              </Link>
            );
          })}
        </div>
        {rows.length === 0 && (
          <div className="workspace-empty">
            <span className="workspace-empty-emblem">E</span>
            <h3>A good conversation starts with hello.</h3>
            <p>
              Visitor questions and human handoff requests appear here. No sample conversations are
              invented.
            </p>
          </div>
        )}
        <div className="workspace-pagination">
          <span>{rows.length} conversations</span>
          <div>
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <button disabled={page * 15 >= rows.length} onClick={() => setPage(page + 1)}>
              Next
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
export function ConversationDetail({
  data,
  conversation: c,
}: {
  data: PlatformSnapshot;
  conversation: Conversation;
}) {
  const [internal, setInternal] = useState(false),
    [requestId, setRequestId] = useState(() => crypto.randomUUID()),
    [refresh, setRefresh] = useState(false);
  const command = useCommand(),
    router = useRouter(),
    lead = data.leads.find((l) => l.id === c.lead_id),
    listing =
      data.listings.find((l) => l.id === c.listing_id) ||
      data.catalog.find((l) => l.id === c.listing_id);
  useEffect(() => {
    if (!refresh) return;
    const timer = setInterval(() => router.refresh(), 10000);
    return () => clearInterval(timer);
  }, [refresh, router]);
  return (
    <>
      <WorkspaceHeading
        eyebrow="A personal connection, in context"
        title={
          lead?.first_name
            ? `A conversation with ${lead.first_name}`
            : 'A conversation with a visitor'
        }
        description={`${c.mode === 'human' ? 'Human-handled' : 'AI-assisted'} · ${c.status} · started ${new Date(c.created_at).toLocaleDateString()}`}
      >
        <Link className="text-link" href="/admin/conversations">
          Back to inbox
        </Link>
        <button className="button button-outline" onClick={() => router.refresh()}>
          Refresh messages
        </button>
      </WorkspaceHeading>
      <div className="conversation-detail-layout">
        <section className="workspace-panel conversation-thread-panel">
          <div className="workspace-panel-heading">
            <h2>The conversation</h2>
            <label className="consent">
              <input
                type="checkbox"
                checked={refresh}
                onChange={(e) => setRefresh(e.target.checked)}
              />
              Refresh every 10 seconds
            </label>
          </div>
          <div className="conversation-thread" role="log" aria-label="Conversation messages">
            {data.messages
              .filter((m) => m.conversation_id === c.id)
              .map((m) => (
                <article
                  key={m.id}
                  className={`thread-message ${m.role} ${m.is_internal ? 'internal' : ''}`}
                >
                  <header>
                    <strong>
                      {m.is_internal
                        ? 'Internal staff note'
                        : m.role === 'visitor'
                          ? 'Website visitor'
                          : m.role === 'assistant'
                            ? 'AI assistant'
                            : m.role === 'system'
                              ? 'System'
                              : 'Human agent'}
                    </strong>
                    <time>
                      {new Date(m.created_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </time>
                  </header>
                  <p>{m.body}</p>
                  {m.provider && <small>Generated by {m.provider}</small>}
                </article>
              ))}
          </div>
          <form
            className="form"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget,
                body = new FormData(form).get('body');
              const r = await command.run(
                'conversation_reply',
                { body, is_internal: internal },
                c.id,
                undefined,
                requestId,
              );
              if (r.ok) {
                form.reset();
                setRequestId(crypto.randomUUID());
              }
            }}
          >
            <label>
              {internal ? 'Internal note' : 'Your personal reply'}
              <textarea
                name="body"
                required
                placeholder={
                  internal
                    ? 'Only permitted staff will see this.'
                    : 'Your reply will appear in this visitor’s chat.'
                }
              />
            </label>
            <label className="consent">
              <input
                type="checkbox"
                checked={internal}
                onChange={(e) => setInternal(e.target.checked)}
              />
              Internal note · hidden from the visitor
            </label>
            <Feedback {...command} />
            <SubmitButton
              busy={command.busy || c.status === 'resolved'}
              label={internal ? 'Save internal note' : 'Send human reply'}
            />
            {c.status === 'resolved' && (
              <p className="demo-note">Reopen this conversation before sending a reply.</p>
            )}
          </form>
        </section>
        <aside>
          <section className="workspace-panel">
            <p className="eyebrow">Thoughtful handoff</p>
            <h3>Conversation handling</h3>
            <form
              className="form mt-8"
              key={c.updated_at}
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                await command.run(
                  'conversation_update',
                  {
                    assigned_to: f.get('assigned_to') || null,
                    mode: f.get('mode'),
                    status: f.get('status'),
                  },
                  c.id,
                );
              }}
            >
              <label>
                Handling
                <select name="mode" defaultValue={c.mode}>
                  <option value="human">Human takeover</option>
                  <option value="ai">AI handling</option>
                </select>
              </label>
              <label>
                Assigned staff
                <select name="assigned_to" defaultValue={c.assigned_to || ''}>
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
                Status
                <select name="status" defaultValue={c.status}>
                  {['open', 'waiting', 'resolved'].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <SubmitButton busy={command.busy} label="Update handling" />
            </form>
          </section>
          <section className="workspace-panel">
            <p className="eyebrow">AI-generated perspective</p>
            <h3>Conversation summary</h3>
            <p className="muted mt-8">
              {c.summary ||
                'No AI summary is available. A configured provider must successfully respond before one is generated.'}
            </p>
            {c.recommendation && (
              <>
                <h4 className="mt-8">Suggested follow-up</h4>
                <p className="muted">{c.recommendation}</p>
              </>
            )}
            <p className="demo-note">
              Provider status: {c.ai_status}. Review generated summaries against the conversation.
            </p>
          </section>
          <section className="workspace-panel">
            <p className="eyebrow">The people and places</p>
            {lead ? (
              <Link className="workspace-record-link" href={`/admin/leads/${lead.id}`}>
                <span>{lead.first_name || lead.email}</span>
                <strong>Contact ↗</strong>
              </Link>
            ) : (
              <p className="muted">This visitor has not yet shared contact details.</p>
            )}
            {listing && (
              <Link className="workspace-record-link" href={`/admin/listings/${listing.id}`}>
                <span>{listing.address_line}</span>
                <strong>Property ↗</strong>
              </Link>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
