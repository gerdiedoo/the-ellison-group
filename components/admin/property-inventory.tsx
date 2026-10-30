'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Search, ArrowUpRight, LayoutGrid, List, Archive } from 'lucide-react';
import type { PlatformSnapshot } from '@/lib/platform/snapshot';
import { money } from '@/lib/utils';
import { WorkspaceHeading, MiniMetric, Feedback, useCommand, WorkspaceDialog } from './shared';
export function PropertyInventory({ data }: { data: PlatformSnapshot }) {
  const [q, setQ] = useState(''),
    [status, setStatus] = useState('all'),
    [publication, setPublication] = useState('all'),
    [sort, setSort] = useState('updated'),
    [view, setView] = useState('list'),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState<string[]>([]),
    [confirm, setConfirm] = useState(false);
  const command = useCommand();
  const filtered = data.listings
    .filter(
      (l) =>
        `${l.title} ${l.address_line} ${l.city} ${l.mls_id}`
          .toLowerCase()
          .includes(q.toLowerCase()) &&
        (status === 'all' || l.status === status) &&
        (publication === 'all' || l.publication_status === publication),
    )
    .sort((a, b) =>
      sort === 'price'
        ? b.list_price - a.list_price
        : sort === 'address'
          ? a.address_line.localeCompare(b.address_line)
          : b.updated_at.localeCompare(a.updated_at),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 12)),
    safePage = Math.min(page, pages),
    rows = filtered.slice((safePage - 1) * 12, safePage * 12);
  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }
  return (
    <>
      <WorkspaceHeading
        eyebrow="Considered homes. Exceptional possibilities."
        title="Your property portfolio"
        description="From the first draft to the next chapter. Every detail, in one place."
      >
        <Link href="/admin/listings/new" className="button">
          <Plus size={16} />
          Add property
        </Link>
      </WorkspaceHeading>
      <div className="workspace-metrics">
        <MiniMetric
          label="In your portfolio"
          value={data.listings.length}
          note="All publication states"
        />
        <MiniMetric
          label="Active & published"
          value={
            data.listings.filter(
              (l) => l.status === 'for_sale' && l.publication_status === 'published',
            ).length
          }
        />
        <MiniMetric
          label="Awaiting publication"
          value={data.listings.filter((l) => l.publication_status === 'draft').length}
        />
        <MiniMetric
          label="Featured homes"
          value={
            data.listings.filter((l) => l.is_featured && l.publication_status === 'published')
              .length
          }
        />
      </div>
      <section className="workspace-panel">
        <div className="workspace-panel-heading">
          <div>
            <p className="eyebrow">A collection of possibilities</p>
            <h2>Property inventory</h2>
          </div>
          <div className="segmented-control" aria-label="Inventory view">
            <button
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
              aria-label="Table view"
            >
              <List size={17} />
            </button>
            <button
              aria-pressed={view === 'grid'}
              onClick={() => setView('grid')}
              aria-label="Photo grid view"
            >
              <LayoutGrid size={17} />
            </button>
          </div>
        </div>
        <div className="workspace-filters">
          <label className="workspace-search">
            <Search size={16} />
            <input
              aria-label="Search properties"
              placeholder="Search address, title, or listing ID"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <select
            aria-label="Listing status filter"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Every listing status</option>
            <option value="for_sale">Active</option>
            <option value="pending">Pending</option>
            <option value="sold">Closed / rented</option>
          </select>
          <select
            aria-label="Publication filter"
            value={publication}
            onChange={(e) => {
              setPublication(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Every publication state</option>
            {['draft', 'published', 'archived'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            aria-label="Sort properties"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="updated">Recently updated</option>
            <option value="price">Price high to low</option>
            <option value="address">Address A–Z</option>
          </select>
        </div>
        {selected.length > 0 && (
          <div className="workspace-bulk">
            <span>{selected.length} selected</span>
            <button
              disabled={command.busy}
              onClick={() =>
                command.run('listing_bulk', { operation: 'feature' }, undefined, selected)
              }
            >
              Feature
            </button>
            <button
              disabled={command.busy}
              onClick={() =>
                command.run('listing_bulk', { operation: 'unfeature' }, undefined, selected)
              }
            >
              Unfeature
            </button>
            <button onClick={() => setConfirm(true)}>
              <Archive size={14} />
              Archive
            </button>
            <button onClick={() => setSelected([])}>Clear selection</button>
          </div>
        )}
        <Feedback {...command} />
        {view === 'list' ? (
          <div className="table-wrap">
            <table className="workspace-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Select visible properties"
                      checked={rows.length > 0 && rows.every((l) => selected.includes(l.id))}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? [...new Set([...selected, ...rows.map((l) => l.id)])]
                            : selected.filter((id) => !rows.some((l) => l.id === id)),
                        )
                      }
                    />
                  </th>
                  <th>Property</th>
                  <th>Price</th>
                  <th>Listing</th>
                  <th>Publication</th>
                  <th>Inquiries</th>
                  <th>
                    <span className="sr-only">Open property</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${l.address_line}`}
                        checked={selected.includes(l.id)}
                        onChange={() => toggle(l.id)}
                      />
                    </td>
                    <td>
                      <Link className="property-table-name" href={`/admin/listings/${l.id}`}>
                        <Image
                          src={l.listing_photos[0]?.url || '/seed/house-3.jpg'}
                          alt={l.address_line}
                          width={88}
                          height={66}
                        />
                        <div>
                          <strong>{l.title || l.address_line}</strong>
                          <span>
                            {l.city}, {l.state} {l.zip}
                          </span>
                          <small>{l.mls_id}</small>
                        </div>
                      </Link>
                    </td>
                    <td className="numeric">
                      {money(l.list_price)}
                      {l.listing_kind === 'rent' && <small>/ month</small>}
                    </td>
                    <td>
                      <span className={`status-pill ${l.status}`}>
                        {l.status === 'for_sale'
                          ? l.listing_kind === 'rent'
                            ? 'For rent'
                            : 'For sale'
                          : l.status === 'sold' && l.listing_kind === 'rent'
                            ? 'Rented'
                            : l.status.replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${l.publication_status}`}>
                        {l.publication_status}
                      </span>
                      {l.is_featured && (
                        <small className="table-subline">Featured · rank {l.featured_rank}</small>
                      )}
                    </td>
                    <td>{data.links.filter((p) => p.listing_id === l.id).length}</td>
                    <td>
                      <Link
                        className="icon-button"
                        href={`/admin/listings/${l.id}`}
                        aria-label={`Manage ${l.address_line}`}
                      >
                        <ArrowUpRight size={17} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="portfolio-grid">
            {rows.map((l) => (
              <article className="portfolio-card" key={l.id}>
                <Link href={`/admin/listings/${l.id}`}>
                  <div>
                    <Image
                      src={l.listing_photos[0]?.url || '/seed/house-3.jpg'}
                      alt={l.address_line}
                      fill
                      sizes="(max-width:700px) 90vw,33vw"
                    />
                    <span className={`status-pill ${l.publication_status}`}>
                      {l.publication_status}
                    </span>
                  </div>
                  <section>
                    <p>
                      {l.city} · {l.property_type}
                    </p>
                    <h3>{l.address_line}</h3>
                    <strong>{money(l.list_price)}</strong>
                    <span>
                      {l.beds} beds · {l.baths_full + l.baths_half * 0.5} baths ·{' '}
                      {l.living_sqft.toLocaleString()} sq.ft.
                    </span>
                  </section>
                </Link>
              </article>
            ))}
          </div>
        )}
        {rows.length === 0 && (
          <div className="workspace-empty">
            <HousePlaceholder />
            <h3>A new chapter is on its way.</h3>
            <p>Try a different filter, or add a property to your portfolio.</p>
            <Link href="/admin/listings/new" className="text-link">
              Add your first property ↗
            </Link>
          </div>
        )}
        <div className="workspace-pagination">
          <span>
            {filtered.length} properties · page {safePage} of {pages}
          </span>
          <div>
            <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
              Previous
            </button>
            <button disabled={safePage >= pages} onClick={() => setPage(safePage + 1)}>
              Next
            </button>
          </div>
        </div>
      </section>
      <WorkspaceDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Archive these properties?"
        description="Their records and inquiry history are preserved. They will no longer appear on the public website."
      >
        <button
          className="button"
          disabled={command.busy}
          onClick={async () => {
            const r = await command.run(
              'listing_bulk',
              { operation: 'archive' },
              undefined,
              selected,
            );
            if (r.ok) {
              setConfirm(false);
              setSelected([]);
            }
          }}
        >
          Archive {selected.length} properties
        </button>
        <Feedback {...command} />
      </WorkspaceDialog>
    </>
  );
}
function HousePlaceholder() {
  return (
    <span className="workspace-empty-emblem" aria-hidden="true">
      E
    </span>
  );
}
