'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Check, CalendarDays, List } from 'lucide-react';
import type { PlatformSnapshot } from '@/lib/platform/snapshot';
import type { Task } from '@/lib/platform/types';
import type { Showing } from '@/lib/types';
import { centralInput, fromCentralInput } from './lead-detail';
import {
  WorkspaceHeading,
  WorkspaceDialog,
  Feedback,
  useCommand,
  SubmitButton,
  MiniMetric,
} from './shared';
export function Schedule({
  data,
  kind,
}: {
  data: PlatformSnapshot;
  kind: 'tasks' | 'appointments';
}) {
  const query = useSearchParams(),
    [editing, setEditing] = useState<Task | Showing | Record<string, never> | null>(null),
    [filter, setFilter] = useState('all'),
    [lead, setLead] = useState(query.get('lead') || ''),
    [property, setProperty] = useState(query.get('property') || ''),
    [view, setView] = useState('schedule');
  const command = useCommand(),
    isTask = kind === 'tasks';
  const records = (isTask ? data.tasks : data.appointments)
    .filter(
      (r) =>
        (!lead || r.lead_id === lead) &&
        (!property || r.listing_id === property) &&
        (filter === 'all' || r.status === filter),
    )
    .sort((a, b) => {
      const at = 'due_at' in a ? a.due_at : a.starts_at,
        bt = 'due_at' in b ? b.due_at : b.starts_at;
      return String(at || '9999').localeCompare(String(bt || '9999'));
    });
  const overdue = data.tasks.filter(
    (t) => t.status === 'open' && t.due_at && Date.parse(t.due_at) < Date.now(),
  );
  const assignmentOptions = (
    <>
      <option value="">Unassigned</option>
      {data.profiles
        .filter((p) => p.role !== 'user')
        .map((p) => (
          <option value={p.id} key={p.id}>
            {p.full_name || p.email}
          </option>
        ))}
    </>
  );
  const listingOptions = [
    ...new Map([...data.listings, ...data.catalog].map((l) => [l.id, l])).values(),
  ];
  const grouped = new Map<string, (Task | Showing)[]>();
  for (const record of records) {
    const date = 'due_at' in record ? record.due_at : record.starts_at;
    const group = date
      ? new Date(date).toLocaleDateString('en-US', {
          timeZone: 'America/Chicago',
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })
      : 'No due date';
    grouped.set(group, [...(grouped.get(group) || []), record]);
  }
  return (
    <>
      <WorkspaceHeading
        eyebrow={
          isTask
            ? 'The small things that make a big difference'
            : 'Make room for the next conversation'
        }
        title={isTask ? 'Tasks & follow-ups' : 'Appointments'}
        description={
          isTask
            ? 'Thoughtful follow-through, one next step at a time.'
            : 'Property tours and personal consultations, in Little Rock’s Central Time.'
        }
      >
        <button className="button" onClick={() => setEditing({})}>
          <Plus size={15} />
          {isTask ? 'Add follow-up' : 'Plan an appointment'}
        </button>
      </WorkspaceHeading>
      <div className="workspace-metrics">
        <MiniMetric
          label={isTask ? 'Open follow-ups' : 'Requested appointments'}
          value={
            isTask
              ? data.tasks.filter((t) => t.status === 'open').length
              : data.appointments.filter((a) => a.status === 'requested').length
          }
        />
        <MiniMetric
          label={isTask ? 'Due now' : 'Confirmed appointments'}
          value={
            isTask
              ? overdue.length
              : data.appointments.filter((a) => a.status === 'confirmed').length
          }
        />
        <MiniMetric
          label="Completed"
          value={
            isTask
              ? data.tasks.filter((t) => t.status === 'completed').length
              : data.appointments.filter((a) => a.status === 'completed').length
          }
        />
        <MiniMetric
          label="In your records"
          value={isTask ? data.tasks.length : data.appointments.length}
        />
      </div>
      <section className="workspace-panel">
        <div className="workspace-panel-heading">
          <h2>{isTask ? 'A little follow-through' : 'Your team schedule'}</h2>
          <div className="segmented-control">
            <button aria-pressed={view === 'schedule'} onClick={() => setView('schedule')}>
              <CalendarDays size={15} />
              Schedule
            </button>
            <button aria-pressed={view === 'list'} onClick={() => setView('list')}>
              <List size={15} />
              List
            </button>
          </div>
        </div>
        <div className="workspace-filters">
          <select
            aria-label="Filter contact"
            value={lead}
            onChange={(e) => setLead(e.target.value)}
          >
            <option value="">All contacts</option>
            {data.leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.first_name || l.email} {l.last_name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter property"
            value={property}
            onChange={(e) => setProperty(e.target.value)}
          >
            <option value="">All properties</option>
            {listingOptions.map((l) => (
              <option value={l.id} key={l.id}>
                {l.address_line}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter schedule status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            {(isTask
              ? ['open', 'completed']
              : ['requested', 'confirmed', 'completed', 'cancelled']
            ).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <Feedback {...command} />
        {view === 'schedule' ? (
          <div className="schedule-groups">
            {[...grouped.entries()].map(([date, items]) => (
              <section key={date}>
                <header>
                  <CalendarDays size={16} />
                  <h3>{date}</h3>
                  <span>
                    {items.length} {isTask ? 'follow-ups' : 'appointments'}
                  </span>
                </header>
                {items.map((record) => (
                  <div className="schedule-record" key={record.id}>
                    {'starts_at' in record ? (
                      <time>
                        {new Date(record.starts_at).toLocaleTimeString('en-US', {
                          timeZone: 'America/Chicago',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                        <small>Central Time</small>
                      </time>
                    ) : (
                      <button
                        className={`task-complete ${record.status === 'completed' ? 'completed' : ''}`}
                        aria-label={
                          record.status === 'completed' ? 'Reopen follow-up' : 'Complete follow-up'
                        }
                        disabled={command.busy}
                        onClick={() =>
                          command.run(
                            'task_save',
                            {
                              ...record,
                              status: record.status === 'completed' ? 'open' : 'completed',
                            },
                            record.id,
                          )
                        }
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <div>
                      <strong>
                        {'title' in record ? record.title : record.kind.replaceAll('_', ' ')}
                      </strong>
                      <p>
                        {data.leads.find((l) => l.id === record.lead_id)?.first_name ||
                          data.leads.find((l) => l.id === record.lead_id)?.email ||
                          'No contact'}
                        {record.listing_id
                          ? ` · ${listingOptions.find((l) => l.id === record.listing_id)?.address_line || 'Property'}`
                          : ''}
                      </p>
                      {record.notes && <small>{record.notes}</small>}
                    </div>
                    <span className={`status-pill ${record.status}`}>{record.status}</span>
                    <button className="text-link" onClick={() => setEditing(record)}>
                      Edit
                    </button>
                  </div>
                ))}
              </section>
            ))}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="workspace-table">
              <thead>
                <tr>
                  <th>{isTask ? 'Follow-up' : 'Appointment'}</th>
                  <th>Contact</th>
                  <th>When · Central Time</th>
                  <th>Status</th>
                  <th>Assigned to</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>{'title' in r ? r.title : r.kind.replaceAll('_', ' ')}</td>
                    <td>{data.leads.find((l) => l.id === r.lead_id)?.email || '—'}</td>
                    <td>
                      {('due_at' in r ? r.due_at : r.starts_at)
                        ? new Date(('due_at' in r ? r.due_at : r.starts_at)!).toLocaleString(
                            'en-US',
                            { timeZone: 'America/Chicago' },
                          )
                        : '—'}
                    </td>
                    <td>
                      <span className={`status-pill ${r.status}`}>{r.status}</span>
                    </td>
                    <td>
                      {data.profiles.find((p) => p.id === r.assigned_to)?.full_name || 'Unassigned'}
                    </td>
                    <td>
                      <button className="text-link" onClick={() => setEditing(r)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {records.length === 0 && (
          <div className="workspace-empty">
            <span className="workspace-empty-emblem">E</span>
            <h3>A little room for what's next.</h3>
            <p>
              {isTask
                ? 'Create a follow-up to make the next conversation easier.'
                : 'Plan a consultation or manage showing requests submitted from property pages.'}
            </p>
          </div>
        )}
      </section>
      <WorkspaceDialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={isTask ? 'The next thoughtful step' : 'Plan a personal appointment'}
        description={
          isTask
            ? 'Internal follow-ups stay linked to their contact and property.'
            : 'Times are entered in Little Rock / Central Time. Saving does not send an external invitation.'
        }
      >
        <form
          className="form"
          key={editing?.id || 'new'}
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const values = isTask
              ? {
                  title: f.get('title'),
                  lead_id: f.get('lead_id') || null,
                  listing_id: f.get('listing_id') || null,
                  assigned_to: f.get('assigned_to') || null,
                  due_at: fromCentralInput(String(f.get('due_at') || '')),
                  status: f.get('status'),
                  notes: f.get('notes'),
                }
              : {
                  lead_id: f.get('lead_id'),
                  listing_id: f.get('listing_id') || null,
                  assigned_to: f.get('assigned_to') || null,
                  starts_at: fromCentralInput(String(f.get('starts_at') || '')),
                  ends_at: fromCentralInput(String(f.get('ends_at') || '')),
                  meeting_type: f.get('meeting_type'),
                  kind: f.get('kind'),
                  status: f.get('status'),
                  notes: f.get('notes'),
                };
            const result = await command.run(
              isTask ? 'task_save' : 'appointment_save',
              values,
              editing?.id,
            );
            if (result.ok) setEditing(null);
          }}
        >
          {isTask && (
            <label>
              Follow-up title
              <input
                name="title"
                defaultValue={editing && 'title' in editing ? editing.title : ''}
                required
              />
            </label>
          )}
          <label>
            Contact
            <select name="lead_id" defaultValue={editing?.lead_id || lead} required={!isTask}>
              <option value="">{isTask ? 'No contact' : 'Choose a contact'}</option>
              {data.leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.first_name || l.email} {l.last_name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Property
            <select name="listing_id" defaultValue={editing?.listing_id || property}>
              <option value="">No specific property</option>
              {listingOptions.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.address_line}
                </option>
              ))}
            </select>
          </label>
          {!isTask && (
            <div className="form-row">
              <label>
                Appointment kind
                <select
                  name="kind"
                  defaultValue={editing && 'kind' in editing ? editing.kind : 'tour'}
                >
                  <option value="tour">Property tour</option>
                  <option value="buyer_consultation">Buyer consultation</option>
                  <option value="seller_consultation">Seller consultation</option>
                </select>
              </label>
              <label>
                Meeting type
                <select
                  name="meeting_type"
                  defaultValue={
                    editing && 'meeting_type' in editing ? editing.meeting_type : 'in_person'
                  }
                >
                  <option value="in_person">In person</option>
                  <option value="video">Video chat</option>
                </select>
              </label>
            </div>
          )}
          {isTask ? (
            <label>
              Due date & time (Central)
              <input
                type="datetime-local"
                name="due_at"
                defaultValue={centralInput(editing && 'due_at' in editing ? editing.due_at : null)}
              />
            </label>
          ) : (
            <div className="form-row">
              <label>
                Starts (Central)
                <input
                  type="datetime-local"
                  name="starts_at"
                  defaultValue={centralInput(
                    editing && 'starts_at' in editing ? editing.starts_at : null,
                  )}
                  required
                />
              </label>
              <label>
                Ends (Central)
                <input
                  type="datetime-local"
                  name="ends_at"
                  defaultValue={centralInput(
                    editing && 'ends_at' in editing ? editing.ends_at : null,
                  )}
                  required
                />
              </label>
            </div>
          )}
          <div className="form-row">
            <label>
              Assigned staff
              <select
                name="assigned_to"
                defaultValue={
                  editing?.assigned_to || (data.user.role === 'agent' ? data.user.id : '')
                }
              >
                {assignmentOptions}
              </select>
            </label>
            <label>
              Status
              <select
                name="status"
                defaultValue={editing?.status || (isTask ? 'open' : 'requested')}
              >
                {(isTask
                  ? ['open', 'completed']
                  : ['requested', 'confirmed', 'completed', 'cancelled']
                ).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Notes
            <textarea name="notes" defaultValue={editing?.notes || ''} />
          </label>
          {data.leads.length === 0 && !isTask && (
            <p className="error-text">
              Add a contact in the CRM before planning an appointment.{' '}
              <Link href="/admin/leads">Open CRM ↗</Link>
            </p>
          )}
          <Feedback {...command} />
          <SubmitButton
            busy={command.busy || (!isTask && data.leads.length === 0)}
            label={isTask ? 'Save follow-up' : 'Save appointment'}
          />
        </form>
      </WorkspaceDialog>
    </>
  );
}
