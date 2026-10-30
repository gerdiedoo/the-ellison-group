'use client';
import { useState } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import type { PlatformSnapshot } from '@/lib/platform/snapshot';
import { captureInput, assistantInput } from '@/lib/platform/schemas';
import { WorkspaceHeading, WorkspaceDialog, Feedback, useCommand, SubmitButton } from './shared';
type Staff = PlatformSnapshot['profiles'][number];
export function TeamSettings({ data }: { data: PlatformSnapshot }) {
  const [editing, setEditing] = useState<Staff | Record<string, never> | null>(null);
  const command = useCommand();
  return (
    <>
      <WorkspaceHeading
        eyebrow="The people behind every next chapter"
        title="Team & permissions"
        description="Clear responsibilities. Thoughtful access. A team working together."
      >
        {data.integrations.demo && (
          <button className="button" onClick={() => setEditing({})}>
            <Plus size={15} />
            Add demo staff
          </button>
        )}
      </WorkspaceHeading>
      <section className="workspace-panel">
        <h2>Workspace access</h2>
        <p className="demo-note">
          Administrators manage the whole workspace. Agents access assigned contacts, linked
          properties, conversations, and follow-ups. Visitors have no staff access. In connected
          mode, create/invite accounts through Supabase Auth before assigning roles here.
        </p>
        <div className="table-wrap mt-8">
          <table className="workspace-table">
            <thead>
              <tr>
                <th>Team member</th>
                <th>Role</th>
                <th>Linked agent profile</th>
                <th>Open contacts</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.profiles.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.full_name || 'New account'}</strong>
                    <small className="table-subline">{p.email}</small>
                  </td>
                  <td>
                    <span className="status-pill">{p.role}</span>
                  </td>
                  <td>{data.agents.find((a) => a.id === p.agent_id)?.full_name || 'Not linked'}</td>
                  <td>
                    {
                      data.leads.filter((l) => l.assigned_to === p.id && l.status !== 'closed')
                        .length
                    }
                  </td>
                  <td>
                    <button className="text-link" onClick={() => setEditing(p)}>
                      Manage access
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="workspace-panel role-explanation">
        <ShieldCheck size={25} strokeWidth={1.5} />
        <div>
          <h3>Access is enforced on the server.</h3>
          <p>
            Role checks and record assignments are applied to routes, mutations, and database
            policies. Hiding a navigation item does not grant or remove access. All role changes are
            audited.
          </p>
        </div>
      </section>
      <WorkspaceDialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="A clear role in the team"
      >
        <form
          className="form"
          key={editing?.id || 'new-staff'}
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget),
              r = await command.run(
                'team_save',
                {
                  email: f.get('email'),
                  full_name: f.get('full_name'),
                  role: f.get('role'),
                  agent_id: f.get('agent_id') || null,
                },
                editing?.id,
              );
            if (r.ok) setEditing(null);
          }}
        >
          <label>
            Full name
            <input name="full_name" defaultValue={editing?.full_name || ''} required />
          </label>
          <label>
            Email
            <input
              name="email"
              type="email"
              defaultValue={editing?.email || ''}
              readOnly={Boolean(editing?.id)}
              required
            />
          </label>
          <label>
            Role
            <select name="role" defaultValue={editing?.role || 'agent'}>
              <option value="user">Visitor / no staff access</option>
              <option value="agent">Agent / assigned records</option>
              <option value="admin">Administrator / full workspace</option>
            </select>
          </label>
          <label>
            Linked agent profile
            <select name="agent_id" defaultValue={editing?.agent_id || ''}>
              <option value="">No linked agent</option>
              {data.agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name}
                </option>
              ))}
            </select>
          </label>
          <p className="demo-note">
            Agent accounts require a linked agent profile. Your own administrator role cannot be
            removed through this screen.
          </p>
          <Feedback {...command} />
          <SubmitButton busy={command.busy} label="Save access" />
        </form>
      </WorkspaceDialog>
    </>
  );
}
export function PlatformSettings({ data }: { data: PlatformSnapshot }) {
  const command = useCommand(),
    capture = captureInput.parse(data.settings.lead_capture),
    assistant = assistantInput.parse(data.settings.assistant);
  return (
    <>
      <WorkspaceHeading
        eyebrow="Your voice. Your way of working."
        title="Workspace settings"
        description="A thoughtful conversion flow and an assistant grounded in your own listing records."
      />
      <div className="integration-grid">
        {[
          [
            'AI assistant',
            data.integrations.ai,
            data.integrations.model || 'Set AI_GATEWAY_API_KEY and AI_GATEWAY_MODEL on the server.',
          ],
          [
            'Google sign-in',
            data.integrations.google,
            'Enable the Google provider in Supabase Auth and set GOOGLE_OAUTH_ENABLED=true.',
          ],
          [
            'Email delivery',
            data.integrations.email,
            'Requires connected production mode, a verified Resend sender, and DELIVERY_MODE=live.',
          ],
          [
            'SMS delivery',
            data.integrations.sms,
            'Requires connected production mode, Twilio configuration, and recorded SMS consent.',
          ],
        ].map(([name, ready, note]) => (
          <section className="workspace-panel" key={String(name)}>
            <span className={`status-pill ${ready ? 'published' : 'draft'}`}>
              {ready ? 'Configured' : 'Not connected'}
            </span>
            <h3>{String(name)}</h3>
            <p>{String(note)}</p>
          </section>
        ))}
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          await command.run('platform_settings', {
            lead_capture: {
              enabled: f.has('gate_enabled'),
              property_ids: f.getAll('property_ids'),
              detail_mode: f.get('detail_mode'),
              allow_basic_browsing: f.has('allow_basic'),
              actions: f.getAll('gate_actions'),
              required_fields: ['email', ...f.getAll('required_fields')],
              google_enabled: f.has('google_enabled'),
            },
            assistant: {
              enabled: f.has('assistant_enabled'),
              instructions: f.get('instructions'),
              approved_faq: f.get('approved_faq'),
            },
          });
        }}
      >
        <div className="settings-layout">
          <section className="workspace-panel form">
            <p className="eyebrow">A natural next step</p>
            <h2>Lead capture</h2>
            <label className="consent">
              <input name="gate_enabled" type="checkbox" defaultChecked={capture.enabled} />
              Enable the configured lead capture flow
            </label>
            <label>
              Properties to include
              <select name="property_ids" multiple size={6} defaultValue={capture.property_ids}>
                {data.listings.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.address_line}
                  </option>
                ))}
              </select>
              <span className="demo-note">
                Leave unselected to include all published properties when the flow is enabled. Hold
                Ctrl / Cmd to select several.
              </span>
            </label>
            <label>
              When should the property prompt appear?
              <select name="detail_mode" defaultValue={capture.detail_mode}>
                <option value="action">After a designated action</option>
                <option value="immediate">On the property detail page</option>
              </select>
            </label>
            <label className="consent">
              <input
                name="allow_basic"
                type="checkbox"
                defaultChecked={capture.allow_basic_browsing}
              />
              Show basic property information before capture
            </label>
            <fieldset>
              <legend>Designated actions</legend>
              {[
                ['save', 'Save a home'],
                ['showing', 'Request a showing'],
                ['contact', 'Contact an agent'],
              ].map(([value, label]) => (
                <label className="consent" key={value}>
                  <input
                    name="gate_actions"
                    value={value}
                    type="checkbox"
                    defaultChecked={capture.actions.includes(
                      value as 'save' | 'showing' | 'contact',
                    )}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <fieldset>
              <legend>Required details</legend>
              <label className="consent">
                <input type="checkbox" checked readOnly />
                Email · normalized lead identity
              </label>
              <label className="consent">
                <input
                  name="required_fields"
                  value="full_name"
                  type="checkbox"
                  defaultChecked={capture.required_fields.includes('full_name')}
                />
                Full name
              </label>
              <label className="consent">
                <input
                  name="required_fields"
                  value="phone"
                  type="checkbox"
                  defaultChecked={capture.required_fields.includes('phone')}
                />
                Phone
              </label>
            </fieldset>
            <label className="consent">
              <input
                name="google_enabled"
                type="checkbox"
                defaultChecked={capture.google_enabled && data.integrations.google}
                disabled={!data.integrations.google}
              />
              Offer Google sign-in when configured
            </label>
            <p className="demo-note">
              Google sign-in authenticates the visitor; any missing required contact details are
              still requested. Form submissions preserve the property and source page. Individual
              property capture flags can also be set in the property editor.
            </p>
          </section>
          <section className="workspace-panel form">
            <p className="eyebrow">Helpful technology. A personal voice.</p>
            <h2>Visitor assistant</h2>
            <label className="consent">
              <input name="assistant_enabled" type="checkbox" defaultChecked={assistant.enabled} />
              Show the visitor chat panel
            </label>
            <label>
              Approved brand instructions
              <textarea name="instructions" rows={5} defaultValue={assistant.instructions} />
            </label>
            <label>
              Approved business information & FAQ
              <textarea name="approved_faq" rows={8} defaultValue={assistant.approved_faq} />
            </label>
            <p className="demo-note">
              Only public listing information and approved FAQ text reach the AI provider. Internal
              leads, consent records, staff notes, and private messages are never added to the model
              context. Provider keys stay in server environment variables.
            </p>
            <p className="integration-notice">
              When the AI provider is unavailable, visitor questions are saved for the team. No
              scripted response is presented as AI. Scheduling and outbound delivery are never
              claimed until the corresponding operation succeeds.
            </p>
          </section>
        </div>
        <Feedback {...command} />
        <SubmitButton busy={command.busy} label="Save workspace settings" />
      </form>
    </>
  );
}
