'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Columns3, List, ArrowUpRight, Download } from 'lucide-react';
import type { PlatformSnapshot } from '@/lib/platform/snapshot';
import type { Lead } from '@/lib/types';
import { initials } from '@/lib/utils';
import {
  WorkspaceHeading,
  WorkspaceDialog,
  Feedback,
  useCommand,
  SubmitButton,
  MiniMetric,
} from './shared';
export function leadValues(l: Lead) {
  return {
    first_name: l.first_name,
    last_name: l.last_name,
    email: l.email,
    phone: l.phone,
    stage_id: l.stage_id,
    assigned_to: l.assigned_to,
    priority: l.priority,
    tags: l.tags,
    follow_up_at: l.follow_up_at,
  };
}
export function Crm({ data }: { data: PlatformSnapshot }) {
  const [q, setQ] = useState(''),
    [view, setView] = useState('pipeline'),
    [stage, setStage] = useState(''),
    [source, setSource] = useState(''),
    [priority, setPriority] = useState(''),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState<string[]>([]),
    [assigned, setAssigned] = useState(''),
    [creating, setCreating] = useState(false);
  const command = useCommand(),
    router = useRouter();
  const rows = data.leads
      .filter(
        (l) =>
          `${l.first_name} ${l.last_name} ${l.email} ${l.phone} ${l.tags.join(' ')}`
            .toLowerCase()
            .includes(q.toLowerCase()) &&
          (!stage || l.stage_id === stage) &&
          (!source || l.source === source) &&
          (!priority || l.priority === priority),
      )
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    pages = Math.max(1, Math.ceil(rows.length / 15)),
    currentPage = Math.min(page, pages);
  async function move(l: Lead, stage_id: string) {
    await command.run('lead_save', { ...leadValues(l), stage_id }, l.id);
  }
  return (
    <>
      <WorkspaceHeading
        eyebrow="Every relationship has a next chapter"
        title="Leads & CRM"
        description="A clear view of your connections, from the first hello to a place called home."
      >
        <a download className="button button-outline" href="/api/admin/leads?format=csv">
          <Download size={15} />
          Export contacts
        </a>
        <button className="button" onClick={() => setCreating(true)}>
          <Plus size={15} />
          Add contact
        </button>
      </WorkspaceHeading>
      <div className="workspace-metrics">
        <MiniMetric label="Contacts in your care" value={data.leads.length} />
        <MiniMetric
          label="New conversations"
          value={data.leads.filter((l) => l.status === 'new').length}
        />
        <MiniMetric
          label="High priority"
          value={data.leads.filter((l) => l.priority === 'high' && l.status !== 'closed').length}
        />
        <MiniMetric
          label="Follow-ups due"
          value={
            data.leads.filter(
              (l) =>
                l.follow_up_at && Date.parse(l.follow_up_at) <= Date.now() && l.status !== 'closed',
            ).length
          }
        />
      </div>
      <section className="workspace-panel">
        <div className="workspace-panel-heading">
          <div>
            <p className="eyebrow">Your relationships, thoughtfully organized</p>
            <h2>{view === 'pipeline' ? 'The next move' : 'Your contact book'}</h2>
          </div>
          <div className="segmented-control">
            <button aria-pressed={view === 'pipeline'} onClick={() => setView('pipeline')}>
              <Columns3 size={15} />
              Pipeline
            </button>
            <button aria-pressed={view === 'list'} onClick={() => setView('list')}>
              <List size={15} />
              List
            </button>
          </div>
        </div>
        <div className="workspace-filters">
          <label className="workspace-search">
            <Search size={16} />
            <input
              aria-label="Search contacts"
              placeholder="Search name, email, phone, or tag"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <select
            aria-label="Filter pipeline stage"
            value={stage}
            onChange={(e) => {
              setStage(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All stages</option>
            {data.stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter lead source"
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All sources</option>
            {[...new Set(data.leads.map((l) => l.source))].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            aria-label="Filter priority"
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All priorities</option>
            {['high', 'normal', 'low'].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <Feedback {...command} />
        {selected.length > 0 && data.user.role === 'admin' && (
          <div className="workspace-bulk">
            <span>{selected.length} contacts selected</span>
            <select
              aria-label="Bulk assign staff member"
              value={assigned}
              onChange={(e) => setAssigned(e.target.value)}
            >
              <option value="">Choose a staff account</option>
              {data.profiles
                .filter((p) => p.role !== 'user')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || p.email}
                  </option>
                ))}
            </select>
            <button
              disabled={!assigned || command.busy}
              onClick={async () => {
                const r = await command.run(
                  'lead_bulk_assign',
                  { assigned_to: assigned },
                  undefined,
                  selected,
                );
                if (r.ok) setSelected([]);
              }}
            >
              Assign selected
            </button>
            <button onClick={() => setSelected([])}>Clear</button>
          </div>
        )}
        {view === 'pipeline' ? (
          <div className="crm-pipeline">
            {data.stages
              .filter((s) => !stage || s.id === stage)
              .map((s) => {
                const items = rows.filter((l) => l.stage_id === s.id);
                return (
                  <section
                    className="pipeline-column"
                    key={s.id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const row = data.leads.find(
                        (l) => l.id === e.dataTransfer.getData('text/plain'),
                      );
                      if (row) void move(row, s.id);
                    }}
                  >
                    <header>
                      <span style={{ background: s.color }} />
                      <h3>{s.name}</h3>
                      <strong>{items.length}</strong>
                    </header>
                    <div>
                      {items.slice(0, 25).map((l) => (
                        <article
                          className="pipeline-card"
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData('text/plain', l.id)}
                          key={l.id}
                        >
                          <div>
                            <span className="contact-initials">
                              {initials(l.first_name ? `${l.first_name} ${l.last_name}` : l.email)}
                            </span>
                            <span className={`status-pill ${l.priority}`}>{l.priority}</span>
                          </div>
                          <Link href={`/admin/leads/${l.id}`}>
                            <h4>{l.first_name ? `${l.first_name} ${l.last_name}` : l.email}</h4>
                            <p>{l.email}</p>
                          </Link>
                          <p className="pipeline-interest">
                            {data.links.filter((p) => p.lead_id === l.id).length} properties of
                            interest
                          </p>
                          <div className="pipeline-card-footer">
                            <span>{l.source}</span>
                            <span>
                              {data.profiles.find((p) => p.id === l.assigned_to)?.full_name ||
                                'Unassigned'}
                            </span>
                          </div>
                          <label className="sr-only" htmlFor={`stage-${l.id}`}>
                            Move {l.first_name || l.email} to stage
                          </label>
                          <select
                            id={`stage-${l.id}`}
                            aria-label={`Move ${l.first_name || l.email} to stage`}
                            value={l.stage_id}
                            disabled={command.busy}
                            onChange={(e) => move(l, e.target.value)}
                          >
                            {data.stages.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </article>
                      ))}
                      {items.length === 0 && (
                        <p className="pipeline-empty">A little room for what's next.</p>
                      )}
                      {items.length > 25 && (
                        <button
                          className="text-link"
                          onClick={() => {
                            setStage(s.id);
                            setView('list');
                          }}
                        >
                          View all {items.length} contacts
                        </button>
                      )}
                    </div>
                  </section>
                );
              })}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="workspace-table">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Contact</th>
                  <th>Stage</th>
                  <th>Source</th>
                  <th>Assigned to</th>
                  <th>Follow-up</th>
                  <th>Open</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice((currentPage - 1) * 15, currentPage * 15).map((l) => (
                  <tr key={l.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${l.email}`}
                        checked={selected.includes(l.id)}
                        onChange={(e) =>
                          setSelected((s) =>
                            e.target.checked ? [...s, l.id] : s.filter((id) => id !== l.id),
                          )
                        }
                      />
                    </td>
                    <td>
                      <Link className="contact-table-name" href={`/admin/leads/${l.id}`}>
                        <span className="contact-initials">
                          {initials(l.first_name ? `${l.first_name} ${l.last_name}` : l.email)}
                        </span>
                        <div>
                          <strong>
                            {l.first_name ? `${l.first_name} ${l.last_name}` : l.email}
                          </strong>
                          <small>{l.email}</small>
                        </div>
                      </Link>
                    </td>
                    <td>{data.stages.find((s) => s.id === l.stage_id)?.name || l.status}</td>
                    <td>{l.source}</td>
                    <td>
                      {data.profiles.find((p) => p.id === l.assigned_to)?.full_name || 'Unassigned'}
                    </td>
                    <td>{l.follow_up_at ? new Date(l.follow_up_at).toLocaleDateString() : '—'}</td>
                    <td>
                      <Link
                        className="icon-button"
                        href={`/admin/leads/${l.id}`}
                        aria-label={`Open ${l.email}`}
                      >
                        <ArrowUpRight size={17} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {view === 'list' && (
          <div className="workspace-pagination">
            <span>
              {rows.length} contacts · page {currentPage} of {pages}
            </span>
            <div>
              <button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                Previous
              </button>
              <button disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>
                Next
              </button>
            </div>
          </div>
        )}
        {data.leads.length === 0 && (
          <div className="workspace-empty">
            <span className="workspace-empty-emblem">E</span>
            <h3>A relationship starts with hello.</h3>
            <p>
              Public inquiries arrive here automatically. You can also add a contact personally.
            </p>
          </div>
        )}
      </section>
      <WorkspaceDialog
        open={creating}
        onClose={() => setCreating(false)}
        title="A new connection"
        description="A matching email reuses its existing contact. No marketing consent is granted by a staff entry."
      >
        <form
          className="form"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget),
              r = await command.run('lead_create', Object.fromEntries(f));
            if (r.ok && r.id) {
              setCreating(false);
              router.push(`/admin/leads/${r.id}`);
            }
          }}
        >
          <div className="form-row">
            <label>
              First name
              <input name="first_name" required />
            </label>
            <label>
              Last name
              <input name="last_name" />
            </label>
          </div>
          <label>
            Email
            <input type="email" name="email" required />
          </label>
          <label>
            Phone
            <input type="tel" name="phone" />
          </label>
          <label>
            Context
            <textarea name="message" placeholder="What would help make their next step clearer?" />
          </label>
          <Feedback {...command} />
          <SubmitButton busy={command.busy} label="Save contact" />
        </form>
      </WorkspaceDialog>
    </>
  );
}
