'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUp, ArrowDown, Plus, Trash2, ArrowUpRight } from 'lucide-react';
import { z } from 'zod';
import type { PlatformSnapshot } from '@/lib/platform/snapshot';
import type { Listing } from '@/lib/types';
import { listingInput } from '@/lib/platform/schemas';
import { WorkspaceHeading, Feedback, useCommand, SubmitButton, WorkspaceDialog } from './shared';
import { isMock } from '@/lib/env';
type Draft = z.output<typeof listingInput>;
function createDraft(data: PlatformSnapshot, listing: Listing | null): Draft {
  if (listing) return listingInput.parse(listing);
  const mls = `MANUAL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  return {
    title: '',
    description: '',
    mls_id: mls,
    slug: '',
    status: 'for_sale',
    publication_status: 'draft',
    listing_kind: 'sale',
    list_price: 0,
    sold_price: null,
    sold_date: null,
    property_type: 'Residential',
    beds: 3,
    baths_full: 2,
    baths_half: 0,
    living_sqft: 0,
    lot_acres: 0,
    year_built: new Date().getFullYear(),
    stories: 1,
    address_line: '',
    city: 'Little Rock',
    state: 'AR',
    zip: '72223',
    neighborhood_id: data.neighborhoods[0]?.id || '',
    lat: 34.7465,
    lng: -92.2896,
    listing_agent_id:
      data.user.role === 'agent' ? data.user.agent_id || '' : data.agents[0]?.id || '',
    courtesy_of: 'The Ellison Group',
    is_featured: false,
    featured_rank: 999,
    lead_capture_required: false,
    raw: { demo: isMock },
    listing_photos: [],
    listing_features: [],
  };
}
const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
export function PropertyEditor({
  data,
  listing,
}: {
  data: PlatformSnapshot;
  listing: Listing | null;
}) {
  const [draft, setDraft] = useState<Draft>(() => createDraft(data, listing)),
    [tab, setTab] = useState('Property details'),
    [uploading, setUploading] = useState(false),
    [confirm, setConfirm] = useState<'archive' | 'delete' | null>(null),
    [confirmation, setConfirmation] = useState(''),
    [note, setNote] = useState('');
  const command = useCommand(),
    router = useRouter();
  function change<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }
  async function submit() {
    const parsed = listingInput.safeParse(draft);
    if (!parsed.success) {
      command.setStatus(
        parsed.error.issues.map((i) => `${i.path.join(' ')}: ${i.message}`).join(' · '),
      );
      return;
    }
    const r = await command.run('listing_save', parsed.data, listing?.id);
    if (r.ok && r.id && !listing) router.replace(`/admin/listings/${r.id}`);
  }
  const input = (key: keyof Draft, label: string, type = 'text') => (
    <label key={key}>
      {label}
      <input
        type={type}
        step={type === 'number' ? 'any' : undefined}
        value={String(draft[key] ?? '')}
        onChange={(e) =>
          change(key, (type === 'number' ? Number(e.target.value) : e.target.value) as never)
        }
        required={['title', 'address_line', 'city', 'state', 'zip', 'mls_id'].includes(key)}
      />
    </label>
  );
  const related = data.links
    .filter((p) => p.listing_id === listing?.id)
    .map((p) => data.leads.find((l) => l.id === p.lead_id))
    .filter((l) => Boolean(l));
  return (
    <>
      <WorkspaceHeading
        eyebrow={
          listing
            ? 'A considered property, down to the details'
            : 'A new addition to your portfolio'
        }
        title={listing ? listing.address_line : 'Add a property'}
        description={
          listing
            ? `${listing.city}, ${listing.state} ${listing.zip} · updated ${new Date(listing.updated_at).toLocaleDateString()}`
            : 'Start with a draft. Publish when every detail is ready.'
        }
      >
        <Link href="/admin/listings" className="text-link">
          Back to inventory
        </Link>
        {listing && (
          <Link className="text-link" href={`/admin/listings/${listing.id}/preview`}>
            Preview saved property ↗
          </Link>
        )}
        {listing?.publication_status === 'published' && (
          <Link
            className="button button-outline"
            href={`/properties/${listing.slug}`}
            target="_blank"
          >
            View public page
            <ArrowUpRight size={15} />
          </Link>
        )}
      </WorkspaceHeading>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="property-editor-layout">
          <section className="workspace-panel">
            <div className="workspace-tabs" role="tablist" aria-label="Property editor">
              {[
                'Property details',
                'Photography',
                'Features & amenities',
                'Inquiries & activity',
              ].map((t) => (
                <button
                  type="button"
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            {tab === 'Property details' ? (
              <div className="form">
                <div className="form-row">
                  {input('title', 'Property title')}
                  {input('mls_id', 'Listing / MLS ID')}
                </div>
                {listing?.mls_id_locked && (
                  <p className="demo-note">
                    The feed identifier is locked. Keep its current value.
                  </p>
                )}
                <label>
                  Description
                  <textarea
                    value={draft.description}
                    onChange={(e) => change('description', e.target.value)}
                    rows={6}
                  />
                </label>
                <div className="form-row">
                  {input('address_line', 'Street address')}
                  {input('city', 'City')}
                  {input('state', 'State')}
                  {input('zip', 'ZIP code')}
                </div>
                <label>
                  Public URL slug
                  <input
                    value={draft.slug}
                    onChange={(e) => change('slug', slugify(e.target.value))}
                  />
                  <button
                    className="text-link"
                    type="button"
                    onClick={() =>
                      change(
                        'slug',
                        slugify(
                          `${draft.address_line}-${draft.city}-${draft.state}-${draft.zip}-${draft.mls_id}`,
                        ),
                      )
                    }
                  >
                    Generate from the address
                  </button>
                </label>
                <div className="form-row">
                  <label>
                    Listing kind
                    <select
                      value={draft.listing_kind}
                      onChange={(e) =>
                        change('listing_kind', e.target.value as Draft['listing_kind'])
                      }
                    >
                      <option value="sale">Sale</option>
                      <option value="rent">Rental</option>
                    </select>
                  </label>
                  <label>
                    Property type
                    <select
                      value={draft.property_type}
                      onChange={(e) =>
                        change('property_type', e.target.value as Draft['property_type'])
                      }
                    >
                      {[
                        'Residential',
                        'Townhouse',
                        'Condo',
                        'Commercial',
                        'Multi-Family',
                        'Land',
                        'Co-Op',
                        'Manufactured',
                        'Other',
                      ].map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                  {input(
                    'list_price',
                    draft.listing_kind === 'rent'
                      ? 'Monthly rental price ($)'
                      : 'Listing price ($)',
                    'number',
                  )}
                  <label>
                    Listing status
                    <select
                      value={draft.status}
                      onChange={(e) => change('status', e.target.value as Draft['status'])}
                    >
                      <option value="for_sale">
                        {draft.listing_kind === 'rent' ? 'For rent' : 'For sale'}
                      </option>
                      <option value="pending">Pending</option>
                      <option value="sold">
                        {draft.listing_kind === 'rent' ? 'Rented' : 'Sold'}
                      </option>
                    </select>
                  </label>
                  {draft.status === 'sold' && (
                    <>
                      {input('sold_price', 'Closed price ($)', 'number')}
                      {input('sold_date', 'Closed date', 'date')}
                    </>
                  )}
                  {input('beds', 'Bedrooms', 'number')}
                  {input('baths_full', 'Full bathrooms', 'number')}
                  {input('baths_half', 'Half bathrooms', 'number')}
                  {input('living_sqft', 'Living area (sq.ft.)', 'number')}
                  {input('lot_acres', 'Lot acres', 'number')}
                  {input('year_built', 'Year built', 'number')}
                  {input('stories', 'Stories', 'number')}
                  {input('lat', 'Latitude', 'number')}
                  {input('lng', 'Longitude', 'number')}
                </div>
                <label>
                  Neighborhood
                  <select
                    value={draft.neighborhood_id}
                    onChange={(e) => change('neighborhood_id', e.target.value)}
                  >
                    {data.neighborhoods.map((n) => (
                      <option value={n.id} key={n.id}>
                        {n.name}
                      </option>
                    ))}
                  </select>
                </label>
                {input('courtesy_of', 'Courtesy / brokerage attribution')}
              </div>
            ) : tab === 'Photography' ? (
              <div className="form">
                <p className="muted">
                  The first photo is the primary image used across the public website. Add captions,
                  then reorder the gallery.
                </p>
                <label>
                  Upload property photography
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    multiple
                    disabled={uploading}
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      setUploading(true);
                      try {
                        for (const file of files) {
                          const body = new FormData();
                          body.set('file', file);
                          body.set('bucket', 'listing-photos');
                          const r = await fetch('/api/admin/upload', { method: 'POST', body });
                          const response = (await r.json()) as { url: string; error?: string };
                          if (!r.ok) throw new Error(response.error);
                          setDraft((d) => ({
                            ...d,
                            listing_photos: [
                              ...d.listing_photos,
                              {
                                url: response.url,
                                caption: file.name.replace(/\.[^.]+$/, ''),
                                width: 1400,
                                height: 900,
                              },
                            ],
                          }));
                        }
                      } catch (error) {
                        command.setStatus(
                          error instanceof Error ? error.message : 'Upload failed.',
                        );
                      } finally {
                        setUploading(false);
                      }
                    }}
                  />
                </label>
                {uploading && <p role="status">Uploading photography…</p>}
                {draft.listing_photos.map((photo, i) => (
                  <div className="photo-editor-row" key={`${photo.url}-${i}`}>
                    <Image src={photo.url} alt={photo.caption} width={140} height={100} />
                    <div>
                      <label>
                        Caption / alt text
                        <input
                          value={photo.caption}
                          onChange={(e) =>
                            change(
                              'listing_photos',
                              draft.listing_photos.map((p, j) =>
                                j === i ? { ...p, caption: e.target.value } : p,
                              ),
                            )
                          }
                        />
                      </label>
                      <span>{i === 0 ? 'Primary image' : `Photo ${i + 1}`}</span>
                      <div className="inline-actions">
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`Move photo ${i + 1} earlier`}
                          disabled={i === 0}
                          onClick={() => {
                            const photos = [...draft.listing_photos];
                            [photos[i - 1], photos[i]] = [photos[i], photos[i - 1]];
                            change('listing_photos', photos);
                          }}
                        >
                          <ArrowUp size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`Move photo ${i + 1} later`}
                          disabled={i === draft.listing_photos.length - 1}
                          onClick={() => {
                            const photos = [...draft.listing_photos];
                            [photos[i + 1], photos[i]] = [photos[i], photos[i + 1]];
                            change('listing_photos', photos);
                          }}
                        >
                          <ArrowDown size={15} />
                        </button>
                        <button
                          type="button"
                          className="text-link"
                          onClick={() =>
                            change('listing_photos', [
                              photo,
                              ...draft.listing_photos.filter((_, j) => j !== i),
                            ])
                          }
                        >
                          Make primary
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`Remove photo ${i + 1}`}
                          onClick={() =>
                            change(
                              'listing_photos',
                              draft.listing_photos.filter((_, j) => j !== i),
                            )
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {isMock && (
                  <button
                    type="button"
                    className="text-link"
                    onClick={() =>
                      change('listing_photos', [
                        ...draft.listing_photos,
                        {
                          url: '/seed/house-3.jpg',
                          caption: 'Demo property exterior · illustrative photography',
                          width: 1400,
                          height: 900,
                        },
                      ])
                    }
                  >
                    Add a clearly labeled demo image
                  </button>
                )}
              </div>
            ) : tab === 'Features & amenities' ? (
              <div className="form">
                {draft.listing_features.map((f, i) => (
                  <div className="feature-editor-row" key={i}>
                    <label>
                      Group
                      <select
                        value={f.group}
                        onChange={(e) =>
                          change(
                            'listing_features',
                            draft.listing_features.map((x, j) =>
                              j === i ? { ...x, group: e.target.value as typeof f.group } : x,
                            ),
                          )
                        }
                      >
                        {['interior', 'area_lot', 'exterior', 'financial'].map((g) => (
                          <option key={g}>{g}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Feature
                      <input
                        value={f.label}
                        onChange={(e) =>
                          change(
                            'listing_features',
                            draft.listing_features.map((x, j) =>
                              j === i ? { ...x, label: e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </label>
                    <label>
                      Value
                      <input
                        value={f.value}
                        onChange={(e) =>
                          change(
                            'listing_features',
                            draft.listing_features.map((x, j) =>
                              j === i ? { ...x, value: e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Remove feature ${i + 1}`}
                      onClick={() =>
                        change(
                          'listing_features',
                          draft.listing_features.filter((_, j) => i !== j),
                        )
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-link"
                  onClick={() =>
                    change('listing_features', [
                      ...draft.listing_features,
                      { group: 'interior', label: '', value: '' },
                    ])
                  }
                >
                  <Plus size={15} />
                  Add an amenity
                </button>
              </div>
            ) : (
              <div>
                <h3>Property-specific inquiries</h3>
                {related.length ? (
                  related.map(
                    (l) =>
                      l && (
                        <Link
                          className="workspace-record-link"
                          key={l.id}
                          href={`/admin/leads/${l.id}`}
                        >
                          {l.first_name} {l.last_name}
                          <span>{l.email} ↗</span>
                        </Link>
                      ),
                  )
                ) : (
                  <p className="muted mt-8">
                    No inquiries in your permitted records for this property yet.
                  </p>
                )}
                <div className="form mt-8">
                  <label>
                    Property note
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="A little context for your team."
                    />
                  </label>
                  <button
                    type="button"
                    className="button button-outline"
                    disabled={!note.trim() || command.busy || !listing}
                    onClick={async () => {
                      const r = await command.run('activity_note', {
                        lead_id: null,
                        listing_id: listing?.id,
                        body: note,
                      });
                      if (r.ok) setNote('');
                    }}
                  >
                    Save property note
                  </button>
                  <Feedback {...command} />
                </div>
                <h3 className="mt-8">Recent activity</h3>
                <div className="activity-timeline">
                  {data.activities
                    .filter((a) => a.listing_id === listing?.id)
                    .map((a) => (
                      <div key={a.id}>
                        <span />
                        <section>
                          <strong>{a.kind.replaceAll('_', ' ')}</strong>
                          <p>{a.body}</p>
                          <small>{new Date(a.created_at).toLocaleString()}</small>
                        </section>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </section>
          <aside className="property-editor-sidebar">
            <section className="workspace-panel">
              <p className="eyebrow">Your next chapter</p>
              <h3>Publication</h3>
              <label className="mt-8">
                Visibility
                <select
                  value={draft.publication_status}
                  onChange={(e) =>
                    change('publication_status', e.target.value as Draft['publication_status'])
                  }
                >
                  <option value="draft">Draft · visible to staff</option>
                  <option value="published">Published · public website</option>
                  <option value="archived">Archived · history preserved</option>
                </select>
              </label>
              <label className="mt-8">
                Responsible agent
                <select
                  value={draft.listing_agent_id}
                  onChange={(e) => change('listing_agent_id', e.target.value)}
                  disabled={data.user.role === 'agent'}
                >
                  {data.agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.full_name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="consent mt-8">
                <input
                  type="checkbox"
                  checked={draft.is_featured}
                  onChange={(e) => change('is_featured', e.target.checked)}
                />
                Featured property
              </label>
              {input('featured_rank', 'Featured order', 'number')}
              <label className="consent mt-8">
                <input
                  type="checkbox"
                  checked={draft.lead_capture_required}
                  onChange={(e) => change('lead_capture_required', e.target.checked)}
                />
                Require lead capture (uses configured gate settings)
              </label>
              <Feedback {...command} />
              <SubmitButton
                busy={command.busy || uploading}
                label={listing ? 'Save property' : 'Create property'}
              />
              {listing && (
                <div className="editor-secondary-actions">
                  <button type="button" className="text-link" onClick={() => setConfirm('archive')}>
                    Archive property
                  </button>
                  {data.user.role === 'admin' && listing.publication_status === 'draft' && (
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => setConfirm('delete')}
                    >
                      Delete draft
                    </button>
                  )}
                </div>
              )}
            </section>
            {listing && (
              <section className="workspace-panel">
                <p className="eyebrow">Property context</p>
                <div className="context-stat">
                  <span>Related inquiries</span>
                  <strong>{related.length}</strong>
                </div>
                <div className="context-stat">
                  <span>Appointments</span>
                  <strong>
                    {data.appointments.filter((a) => a.listing_id === listing.id).length}
                  </strong>
                </div>
                <div className="context-stat">
                  <span>Recorded views</span>
                  <strong>
                    {
                      data.activities.filter(
                        (a) => a.listing_id === listing.id && a.kind === 'property_viewed',
                      ).length
                    }
                  </strong>
                </div>
                <p className="demo-note">
                  Only recorded, consent-permitted events are counted. Seed catalog photography is
                  illustrative.
                </p>
                <Link className="text-link mt-8" href={`/admin/tasks?property=${listing.id}`}>
                  Property follow-ups
                  <ArrowUpRight size={14} />
                </Link>
              </section>
            )}
          </aside>
        </div>
      </form>
      <WorkspaceDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm === 'delete' ? 'Delete this draft?' : 'Archive this property?'}
        description={
          confirm === 'delete'
            ? 'This is limited to drafts without inquiries or appointments. An audit record is preserved.'
            : 'Public visibility is removed; inquiry and transaction history remain intact.'
        }
      >
        {confirm === 'delete' && (
          <label>
            Type {listing?.address_line} to confirm
            <input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
          </label>
        )}
        <button
          className="button mt-8"
          disabled={
            command.busy || (confirm === 'delete' && confirmation !== listing?.address_line)
          }
          onClick={async () => {
            const r = await command.run(
              confirm === 'delete' ? 'listing_delete' : 'listing_archive',
              { confirmation },
              listing?.id,
            );
            if (r.ok) {
              setConfirm(null);
              router.push('/admin/listings');
            }
          }}
        >
          {confirm === 'delete' ? 'Confirm delete' : 'Archive property'}
        </button>
        <Feedback {...command} />
      </WorkspaceDialog>
    </>
  );
}
