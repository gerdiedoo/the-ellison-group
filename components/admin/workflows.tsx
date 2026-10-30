'use client';
import { useState } from 'react';
import { Plus, Play, Workflow } from 'lucide-react';
import type { PlatformSnapshot } from '@/lib/platform/snapshot';
import type { AutomationRule, PipelineStage } from '@/lib/platform/types';
import { WorkspaceHeading, WorkspaceDialog, Feedback, useCommand, SubmitButton } from './shared';
export function Workflows({ data }: { data: PlatformSnapshot }) {
  const [tab, setTab] = useState('Automations'),
    [rule, setRule] = useState<AutomationRule | Record<string, never> | null>(null),
    [stage, setStage] = useState<PipelineStage | Record<string, never> | null>(null);
  const command = useCommand();
  return (
    <>
      <WorkspaceHeading
        eyebrow="Thoughtful follow-through, at the right moment"
        title="Automations & pipeline"
        description="Practical internal workflows. Observable actions, without duplicate execution."
      >
        <button
          className="button button-outline"
          disabled={command.busy}
          onClick={() => command.run('run_automations')}
        >
          <Play size={14} />
          Run due checks
        </button>
        <button
          className="button"
          onClick={() => (tab === 'Pipeline stages' ? setStage({}) : setRule({}))}
        >
          <Plus size={15} />
          {tab === 'Pipeline stages' ? 'Add stage' : 'New automation'}
        </button>
      </WorkspaceHeading>
      <div className="workspace-tabs" role="tablist" aria-label="Automation sections">
        {['Automations', 'Execution history', 'Pipeline stages'].map((t) => (
          <button role="tab" aria-selected={tab === t} key={t} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      <Feedback {...command} />
      {tab === 'Automations' ? (
        <div className="automation-grid">
          {data.rules.map((r) => (
            <section className="workspace-panel automation-card" key={r.id}>
              <header>
                <Workflow size={20} strokeWidth={1.5} />
                <span className={`status-pill ${r.enabled ? 'published' : 'draft'}`}>
                  {r.enabled ? 'Enabled' : 'Paused'}
                </span>
              </header>
              <h2>{r.name}</h2>
              <p>
                When <strong>{r.event.replaceAll('_', ' ')}</strong>,{' '}
                {r.action === 'create_task'
                  ? 'create a follow-up task'
                  : 'create an internal notification'}
                .
              </p>
              <div className="automation-action">
                <span>Next step</span>
                <strong>{r.task_title}</strong>
                <small>
                  {r.delay_hours} hour task due offset ·{' '}
                  {data.profiles.find((p) => p.id === r.assigned_to)?.full_name ||
                    'Use contact assignment'}
                </small>
              </div>
              <footer>
                <button className="text-link" onClick={() => setRule(r)}>
                  Edit workflow
                </button>
                <button
                  className="text-link"
                  disabled={command.busy}
                  onClick={() => command.run('rule_save', { ...r, enabled: !r.enabled }, r.id)}
                >
                  {r.enabled ? 'Pause' : 'Enable'}
                </button>
              </footer>
            </section>
          ))}
          {data.rules.length === 0 && (
            <div className="workspace-panel workspace-empty">
              <span className="workspace-empty-emblem">E</span>
              <h3>Make the next step a little easier.</h3>
              <p>
                Create a task or internal notification when a new inquiry arrives, an assignment
                changes, or a follow-up becomes due.
              </p>
              <button className="text-link" onClick={() => setRule({})}>
                Create your first automation ↗
              </button>
            </div>
          )}
        </div>
      ) : tab === 'Execution history' ? (
        <section className="workspace-panel">
          <h2>Every action, accounted for.</h2>
          <p className="demo-note">
            A unique rule/event key prevents repeated task or notification creation. No external
            deliveries are simulated.
          </p>
          <div className="table-wrap mt-8">
            <table className="workspace-table">
              <thead>
                <tr>
                  <th>Workflow</th>
                  <th>When</th>
                  <th>Result</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.runs
                  .slice()
                  .reverse()
                  .map((r) => (
                    <tr key={r.id}>
                      <td>
                        {data.rules.find((rule) => rule.id === r.rule_id)?.name || 'Workflow'}
                      </td>
                      <td>{new Date(r.created_at).toLocaleString()}</td>
                      <td>{r.result}</td>
                      <td>
                        <span className={`status-pill ${r.status}`}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {data.runs.length === 0 && (
            <p className="muted mt-8">
              Execution history appears when an enabled rule matches a real event.
            </p>
          )}
        </section>
      ) : (
        <section className="workspace-panel">
          <div className="workspace-panel-heading">
            <div>
              <p className="eyebrow">A process that fits your team</p>
              <h2>Pipeline stages</h2>
            </div>
          </div>
          <div className="pipeline-stage-list">
            {data.stages.map((s) => (
              <div key={s.id}>
                <span style={{ background: s.color }} />
                <strong>{s.name}</strong>
                <small>
                  Order {s.sort_order} ·{' '}
                  {s.outcome === 'open'
                    ? 'Open opportunity'
                    : s.outcome === 'won'
                      ? 'Converted'
                      : 'Lost'}
                </small>
                <button className="text-link" onClick={() => setStage(s)}>
                  Edit stage
                </button>
              </div>
            ))}
          </div>
          <p className="demo-note">
            Stages are never deleted while contacts may reference them. Change their order, label,
            color, or outcome instead. Won and lost outcomes close the contact's legacy status.
          </p>
        </section>
      )}
      <WorkspaceDialog
        open={rule !== null}
        onClose={() => setRule(null)}
        title={rule?.id ? 'Refine a workflow' : 'A thoughtful workflow'}
      >
        <form
          className="form"
          key={rule?.id || 'new-rule'}
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget),
              r = await command.run(
                'rule_save',
                {
                  name: f.get('name'),
                  event: f.get('event'),
                  action: f.get('action'),
                  enabled: f.has('enabled'),
                  delay_hours: Number(f.get('delay_hours')),
                  task_title: f.get('task_title'),
                  assigned_to: f.get('assigned_to') || null,
                },
                rule?.id,
              );
            if (r.ok) setRule(null);
          }}
        >
          <label>
            Workflow name
            <input name="name" defaultValue={rule?.name || ''} required />
          </label>
          <label>
            When this happens
            <select name="event" defaultValue={rule?.event || 'lead_created'}>
              {[
                'lead_created',
                'inquiry_submitted',
                'lead_assigned',
                'appointment_scheduled',
                'follow_up_due',
                'lead_uncontacted',
              ].map((v) => (
                <option key={v} value={v}>
                  {v.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </label>
          <label>
            Then do this
            <select name="action" defaultValue={rule?.action || 'create_task'}>
              <option value="create_task">Create a follow-up task</option>
              <option value="internal_notification">Create an internal notification</option>
            </select>
          </label>
          <label>
            Task / notification title
            <input name="task_title" defaultValue={rule?.task_title || ''} required />
          </label>
          <label>
            Task due offset (hours after the event)
            <input
              name="delay_hours"
              type="number"
              min="0"
              max="8760"
              defaultValue={rule?.delay_hours || 0}
            />
          </label>
          <label>
            Assigned staff
            <select name="assigned_to" defaultValue={rule?.assigned_to || ''}>
              <option value="">Use the contact's assigned staff</option>
              {data.profiles
                .filter((p) => p.role !== 'user')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || p.email}
                  </option>
                ))}
            </select>
          </label>
          <label className="consent">
            <input type="checkbox" name="enabled" defaultChecked={rule?.enabled || false} />
            Enable this automation
          </label>
          <Feedback {...command} />
          <SubmitButton busy={command.busy} label="Save workflow" />
        </form>
      </WorkspaceDialog>
      <WorkspaceDialog
        open={stage !== null}
        onClose={() => setStage(null)}
        title="A stage in your process"
      >
        <form
          className="form"
          key={stage?.id || 'new-stage'}
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget),
              r = await command.run(
                'stage_save',
                {
                  name: f.get('name'),
                  sort_order: Number(f.get('sort_order')),
                  outcome: f.get('outcome'),
                  color: f.get('color'),
                },
                stage?.id,
              );
            if (r.ok) setStage(null);
          }}
        >
          <label>
            Stage name
            <input name="name" defaultValue={stage?.name || ''} required />
          </label>
          <label>
            Order
            <input
              name="sort_order"
              type="number"
              min="0"
              defaultValue={stage?.sort_order ?? data.stages.length}
            />
          </label>
          <label>
            Outcome
            <select name="outcome" defaultValue={stage?.outcome || 'open'}>
              <option value="open">Open opportunity</option>
              <option value="won">Converted / won</option>
              <option value="lost">Lost</option>
            </select>
          </label>
          <label>
            Stage color
            <input name="color" type="color" defaultValue={stage?.color || '#8b1e2d'} />
          </label>
          <Feedback {...command} />
          <SubmitButton busy={command.busy} label="Save stage" />
        </form>
      </WorkspaceDialog>
    </>
  );
}
