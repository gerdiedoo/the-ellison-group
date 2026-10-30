import Image from 'next/image';
import { currentUser } from '@/lib/auth';
import { getCaptureConfig, requiresCapture, hasCaptureAccess } from '@/lib/platform/capture';
import { GateForm } from '@/components/forms/property-gate';
import { PropertyDetail } from './property-detail';
import { money } from '@/lib/utils';
import type { Listing } from '@/lib/types';
import { isMock } from '@/lib/env';
export async function PropertyAccess({ listing }: { listing: Listing }) {
  const config = await getCaptureConfig();
  if (!requiresCapture(listing, 'detail', config) || (await hasCaptureAccess(listing.id)))
    return <PropertyDetail listing={listing} />;
  const user = await currentUser();
  return (
    <div className="container property-access" data-listing-id={listing.id}>
      <div>
        {config.allow_basic_browsing ? (
          <>
            <p className="eyebrow">Your next chapter, in Little Rock</p>
            <h1>{listing.address_line}</h1>
            <p className="intro-copy mt-8">
              {listing.city}, {listing.state} {listing.zip} · {money(listing.list_price)}
            </p>
            <div className="gate-property-photo">
              <Image
                src={listing.listing_photos[0]?.url || '/seed/house-3.jpg'}
                alt={listing.address_line}
                fill
                priority
                sizes="50vw"
              />
            </div>
          </>
        ) : (
          <>
            <p className="eyebrow">The Ellison Group</p>
            <h1>A place for your next chapter.</h1>
            <p className="intro-copy mt-8">
              A personal introduction helps us guide your search with care.
            </p>
          </>
        )}
      </div>
      <GateForm
        listing={{
          id: listing.id,
          slug: listing.slug,
          address_line: listing.address_line,
          city: listing.city,
        }}
        config={{
          ...config,
          google_enabled:
            config.google_enabled && !isMock && process.env.GOOGLE_OAUTH_ENABLED === 'true',
        }}
        profile={
          user ? { full_name: user.full_name, email: user.email, phone: user.phone } : undefined
        }
      />
    </div>
  );
}
