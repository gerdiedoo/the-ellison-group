import Link from 'next/link';
import { notFound } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { isStaff } from '@/lib/platform/permissions';
import { platformSnapshot } from '@/lib/platform/snapshot';
import { Gallery } from '@/components/property/gallery';
import { WorkspaceHeading } from '@/components/admin/shared';
import { money } from '@/lib/utils';
export default async function PropertyPreview({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!isStaff(user)) return null;
  const { id } = await params,
    data = await platformSnapshot(user),
    listing = data.listings.find((l) => l.id === id);
  if (!listing) notFound();
  return (
    <>
      <WorkspaceHeading
        eyebrow="A considered preview"
        title={listing.title}
        description={`Saved ${listing.publication_status} · ${listing.address_line}, ${listing.city}`}
      >
        <Link className="text-link" href={`/admin/listings/${id}`}>
          Return to property ↗
        </Link>
      </WorkspaceHeading>
      <div className="property-detail">
        <Gallery listing={listing} />
        <section className="workspace-panel mt-8">
          <span className={`status-pill ${listing.status}`}>
            {listing.status === 'for_sale'
              ? listing.listing_kind === 'rent'
                ? 'For rent'
                : 'For sale'
              : listing.status === 'sold' && listing.listing_kind === 'rent'
                ? 'Rented'
                : listing.status}
          </span>
          <h2 className="mt-8">{listing.address_line}</h2>
          <p className="intro-copy mt-8">
            {money(listing.list_price)}
            {listing.listing_kind === 'rent' ? ' / month' : ''} · {listing.beds} beds ·{' '}
            {listing.baths_full + listing.baths_half * 0.5} baths ·{' '}
            {listing.living_sqft.toLocaleString()} sq.ft.
          </p>
          <p className="intro-copy mt-8">{listing.description}</p>
          <section className="features-section">
            <h2>Features & amenities</h2>
            {(['interior', 'area_lot', 'exterior', 'financial'] as const).map((group) => (
              <details className="feature-accordion" key={group} open>
                <summary>{group.replaceAll('_', ' & ')}</summary>
                <dl>
                  {listing.listing_features
                    .filter((f) => f.group === group)
                    .map((f) => (
                      <div key={f.id}>
                        <dt>{f.label}</dt>
                        <dd>{f.value}</dd>
                      </div>
                    ))}
                </dl>
              </details>
            ))}
          </section>
        </section>
      </div>
    </>
  );
}
