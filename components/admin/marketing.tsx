'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plus, Copy, ArrowUpRight } from 'lucide-react';
import type { PlatformSnapshot } from '@/lib/platform/snapshot';
import type { Campaign, MessageTemplate } from '@/lib/platform/types';
import { WorkspaceHeading, WorkspaceDialog, Feedback, useCommand, SubmitButton } from './shared';
export function Marketing({ data }: { data: PlatformSnapshot }) {
  const [tab, setTab] = useState('Campaigns'),
    [campaign, setCampaign] = useState<Campaign | Record<string, never> | null>(null),
    [template, setTemplate] = useState<MessageTemplate | Record<string, never> | null>(null);
  const command = useCommand();
  const link = (c: Campaign) =>
    `/campaign/${c.slug}?${new URLSearchParams({ utm_source: c.utm_source, utm_medium: c.utm_medium, utm_campaign: c.utm_campaign })}`;
  return (
    <>
      <WorkspaceHeading
        eyebrow="The right story. The right connection."
        title="Marketing, with a local perspective"
        description="Purposeful campaigns, attributed inquiries, and personal messages that sound like your team."
      >
        <button
          className="button"
          onClick={() => (tab === 'Campaigns' ? setCampaign({}) : setTemplate({}))}
        >
          <Plus size={15} />
          {tab === 'Campaigns' ? 'New campaign' : 'New template'}
        </button>
      </WorkspaceHeading>
      <div className="workspace-tabs" role="tablist" aria-label="Marketing tools">
        {['Campaigns', 'Message templates'].map((t) => (
          <button role="tab" aria-selected={tab === t} key={t} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      <Feedback {...command} />
      {tab === 'Campaigns' ? (
        <section className="workspace-panel">
          <div className="workspace-panel-heading">
            <h2>A purposeful invitation</h2>
            <p className="muted">Landing pages use your existing public brand and lead form.</p>
          </div>
          <div className="table-wrap">
            <table className="workspace-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Attribution</th>
                  <th>Captured contacts</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.name}</strong>
                      <small className="table-subline">{c.slug}</small>
                    </td>
                    <td>
                      {c.utm_source} / {c.utm_medium}
                      <small className="table-subline">{c.utm_campaign}</small>
                    </td>
                    <td>
                      {data.leads.filter((l) => l.utm.utm_campaign === c.utm_campaign).length}
                    </td>
                    <td>
                      <span
                        className={`status-pill ${c.status === 'active' ? 'published' : c.status}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <div className="inline-actions">
                        <button className="text-link" onClick={() => setCampaign(c)}>
                          Edit
                        </button>
                        {c.status === 'active' && (
                          <>
                            <Link
                              className="icon-button"
                              href={link(c)}
                              target="_blank"
                              aria-label={`Open ${c.name} landing page`}
                            >
                              <ArrowUpRight size={16} />
                            </Link>
                            <button
                              className="icon-button"
                              aria-label={`Copy ${c.name} campaign link`}
                              onClick={async () => {
                                await navigator.clipboard.writeText(
                                  `${window.location.origin}${link(c)}`,
                                );
                                command.setStatus('Campaign link copied.');
                              }}
                            >
                              <Copy size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.campaigns.length === 0 && (
            <div className="workspace-empty">
              <span className="workspace-empty-emblem">E</span>
              <h3>A local story, ready to share.</h3>
              <p>Create an attributed landing page for a property or a personal consultation.</p>
            </div>
          )}
        </section>
      ) : (
        <div className="automation-grid">
          {data.templates.map((t) => (
            <section className="workspace-panel template-card" key={t.id}>
              <p className="eyebrow">{t.channel} template</p>
              <h2>{t.name}</h2>
              <strong>{t.subject}</strong>
              <p>{t.body}</p>
              <button className="text-link" onClick={() => setTemplate(t)}>
                Edit template ↗
              </button>
            </section>
          ))}
          {data.templates.length === 0 && (
            <div className="workspace-panel workspace-empty">
              <h3>A personal voice, with a thoughtful starting point.</h3>
              <p>
                Create reusable email, SMS, or internal note templates. Saving never sends a
                message.
              </p>
            </div>
          )}
        </div>
      )}
      <WorkspaceDialog
        open={campaign !== null}
        onClose={() => setCampaign(null)}
        title="A purposeful campaign"
      >
        <form
          className="form"
          key={campaign?.id || 'new-campaign'}
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget),
              r = await command.run(
                'campaign_save',
                {
                  name: f.get('name'),
                  slug: f.get('slug'),
                  status: f.get('status'),
                  utm_source: f.get('utm_source'),
                  utm_medium: f.get('utm_medium'),
                  utm_campaign: f.get('utm_campaign'),
                  description: f.get('description'),
                  listing_id: f.get('listing_id') || null,
                },
                campaign?.id,
              );
            if (r.ok) setCampaign(null);
          }}
        >
          <label>
            Name
            <input name="name" defaultValue={campaign?.name || ''} required />
          </label>
          <label>
            Landing page slug
            <input name="slug" pattern="[a-z0-9-]+" defaultValue={campaign?.slug || ''} required />
          </label>
          <label>
            Invitation / supporting copy
            <textarea name="description" defaultValue={campaign?.description || ''} />
          </label>
          <label>
            Featured property
            <select name="listing_id" defaultValue={campaign?.listing_id || ''}>
              <option value="">Personal consultation</option>
              {data.catalog.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.address_line}
                </option>
              ))}
            </select>
          </label>
          <div className="form-row">
            <label>
              UTM source
              <input
                name="utm_source"
                defaultValue={campaign?.utm_source || ''}
                placeholder="newsletter"
                required
              />
            </label>
            <label>
              UTM medium
              <input
                name="utm_medium"
                defaultValue={campaign?.utm_medium || ''}
                placeholder="email"
                required
              />
            </label>
          </div>
          <label>
            UTM campaign
            <input
              name="utm_campaign"
              defaultValue={campaign?.utm_campaign || ''}
              placeholder="autumn-in-little-rock"
              required
            />
          </label>
          <label>
            Status
            <select name="status" defaultValue={campaign?.status || 'draft'}>
              {['draft', 'active', 'archived'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <p className="demo-note">
            Only active campaigns have a public landing page. The campaign link carries attribution
            into the existing lead capture flow.
          </p>
          <Feedback {...command} />
          <SubmitButton busy={command.busy} label="Save campaign" />
        </form>
      </WorkspaceDialog>
      <WorkspaceDialog
        open={template !== null}
        onClose={() => setTemplate(null)}
        title="A thoughtful message template"
      >
        <form
          className="form"
          key={template?.id || 'new-template'}
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget),
              r = await command.run('template_save', Object.fromEntries(f), template?.id);
            if (r.ok) setTemplate(null);
          }}
        >
          <label>
            Name
            <input name="name" defaultValue={template?.name || ''} required />
          </label>
          <label>
            Channel
            <select name="channel" defaultValue={template?.channel || 'email'}>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="internal">Internal note</option>
            </select>
          </label>
          <label>
            Subject
            <input name="subject" defaultValue={template?.subject || ''} />
          </label>
          <label>
            Message
            <textarea name="body" defaultValue={template?.body || ''} required rows={8} />
          </label>
          <p className="demo-note">
            Supported personal details: {'{{first_name}}'} and {'{{last_name}}'}. Review every
            message before using a configured delivery provider.
          </p>
          <Feedback {...command} />
          <SubmitButton busy={command.busy} label="Save template" />
        </form>
      </WorkspaceDialog>
    </>
  );
}
