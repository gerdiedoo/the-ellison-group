import { CalendarDays, GraduationCap, ArrowUpRight } from 'lucide-react';
import type { Listing, School } from '@/lib/types';
import { money, number } from '@/lib/utils';
import { ContactButton } from '@/components/shell/site-provider';
import { PropertyCompare, type ComparisonHome } from './property-tools';

export function PropertyOverview({
  listing,
  homes,
}: {
  listing: Listing;
  homes: ComparisonHome[];
}) {
  const feature = (term: string) =>
    listing.listing_features.find((item) => item.label.toLowerCase().includes(term))?.value;
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(listing.created_at).getTime()) / 86400000),
  );
  const details = [
    ['Property type', listing.property_type],
    [
      'Year built',
      listing.property_type !== 'Land' && listing.year_built
        ? String(listing.year_built)
        : 'Not provided',
    ],
    ['Living area', listing.living_sqft ? `${number(listing.living_sqft)} sq.ft.` : 'Not provided'],
    ['Lot size', `${listing.lot_acres.toFixed(2)} acres`],
    ['Time on site', `${days} ${days === 1 ? 'day' : 'days'}`],
    ['MLS® ID', listing.mls_id],
    ['Parking', feature('parking') || 'Not provided'],
    [
      'Heating & cooling',
      feature('heating') || feature('hvac') || feature('cooling') || 'Not provided',
    ],
    [
      'HOA dues',
      Number(listing.raw.hoa) > 0 ? `${money(Number(listing.raw.hoa))} / month` : 'Not provided',
    ],
  ];
  return (
    <section className="property-extra-section property-overview" id="property-overview">
      <div className="property-section-heading">
        <div>
          <p className="eyebrow">The details at a glance</p>
          <h2>Property Overview</h2>
        </div>
        <PropertyCompare key={listing.id} current={listing} homes={homes} />
      </div>
      <dl className="property-overview-grid">
        {details.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function PropertyOpenHouses({ listing }: { listing: Listing }) {
  return (
    <section className="property-extra-section" id="property-open-houses">
      <p className="eyebrow">Come on in</p>
      <h2>Open Houses</h2>
      <div className="property-open-house-card">
        <CalendarDays size={30} strokeWidth={1.3} aria-hidden="true" />
        <div>
          <h3>
            {listing.status === 'sold'
              ? 'This property is no longer available.'
              : 'Prefer a personal tour?'}
          </h3>
          <p>
            {listing.status === 'sold'
              ? 'Connect with our team to explore similar properties.'
              : 'No open-house dates are currently listed. Choose a time for an in-person or video showing, and our team will confirm availability.'}
          </p>
          {listing.status !== 'sold' && (
            <a className="text-link" href="#showing">
              Schedule a showing
              <ArrowUpRight size={16} />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

export function PropertySchools({ schools, listing }: { schools: School[]; listing: Listing }) {
  const available = schools.filter((school) => !/placeholder/i.test(school.name));
  return (
    <section className="property-extra-section" id="property-schools">
      <p className="eyebrow">Get to know the area</p>
      <h2>Nearby Schools</h2>
      {available.length ? (
        <div className="property-school-grid">
          {available.map((school) => (
            <article key={school.id}>
              <GraduationCap size={22} strokeWidth={1.3} aria-hidden="true" />
              <div>
                <h3>{school.name}</h3>
                <p>
                  {school.category} · {school.grades}
                </p>
                <span>{school.level}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="property-empty">
          <GraduationCap size={28} strokeWidth={1.3} aria-hidden="true" />
          <h3>A closer look at local schools.</h3>
          <p>
            Verified school information is not available for this property yet. Our team can help
            you find the right district contacts.
          </p>
          <ContactButton
            className="text-link"
            extra={{ listing_id: listing.id }}
            message={`I'd like school district information for ${listing.address_line}.`}
          >
            Ask about local schools
          </ContactButton>
        </div>
      )}
      <p className="demo-note">
        Nearby schools do not confirm attendance eligibility. Verify school boundaries and
        enrollment directly with the district.
      </p>
    </section>
  );
}
