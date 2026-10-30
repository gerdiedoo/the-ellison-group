import Image from 'next/image';
import Link from 'next/link';
import { Gallery } from './gallery';
import { Share } from './share';
import { SaveHome, ListingCard } from '@/components/search/listing-card';
import { ContactButton } from '@/components/shell/site-provider';
import { MortgageCalculator } from './mortgage-calculator';
import { ShowingScheduler } from '@/components/forms/showing-scheduler';
import { JsonLd } from '@/components/ui/json-ld';
import { SectionHeading, DemoNote, TextLink } from '@/components/ui/primitives';
import { money, number } from '@/lib/utils';
import { getAgents, getNeighborhoods, getListings } from '@/lib/data';
import { env } from '@/lib/env';
import type { Listing } from '@/lib/types';
export async function PropertyDetail({ listing: l }: { listing: Listing }) {
  const [agents, neighborhoods, all] = await Promise.all([
    getAgents(),
    getNeighborhoods(),
    getListings(),
  ]);
  const agent = agents.find((a) => a.id === l.listing_agent_id) || agents[0],
    n = neighborhoods.find((n) => n.id === l.neighborhood_id);
  const similar = all
    .filter(
      (x) =>
        x.id !== l.id &&
        x.status !== 'sold' &&
        x.zip === l.zip &&
        x.list_price >= l.list_price * 0.7 &&
        x.list_price <= l.list_price * 1.3,
    )
    .slice(0, 3);
  return (
    <article className="property-detail" data-listing-id={l.id}>
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/properties/sale">Properties</Link>
          <span>/</span>
          <span>{l.address_line}</span>
        </nav>
        <Gallery listing={l} />
        <header className="property-heading">
          <div>
            <span className={`badge ${l.status}`}>
              {l.status === 'for_sale'
                ? l.listing_kind === 'rent'
                  ? 'For Rent'
                  : 'For Sale'
                : l.status === 'pending'
                  ? 'Pending'
                  : l.listing_kind === 'rent'
                    ? 'Rented'
                    : 'Sold'}
            </span>
            <h1>{l.address_line}</h1>
            <p>
              {l.city}, {l.state} {l.zip}
            </p>
          </div>
          <div className="property-price-actions">
            <p className="property-price">
              {money(l.status === 'sold' && l.sold_price ? l.sold_price : l.list_price)}
              {l.listing_kind === 'rent' ? ' / month' : ''}
            </p>
            <div className="inline-actions">
              <Share title={`${l.address_line} | The Ellison Group`} />
              <div className="save-detail">
                <SaveHome id={l.id} />
                <span>Save home</span>
              </div>
            </div>
          </div>
        </header>
        <DemoNote />
        <div className="property-main-layout">
          <div>
            <div className="property-stats">
              {l.property_type !== 'Land' && (
                <>
                  <div>
                    <strong>{l.beds}</strong>
                    <span>Bedrooms</span>
                  </div>
                  <div>
                    <strong>{l.baths_full + l.baths_half * 0.5}</strong>
                    <span>Bathrooms</span>
                  </div>
                  <div>
                    <strong>{number(l.living_sqft)}</strong>
                    <span>Sq.Ft. living area</span>
                  </div>
                </>
              )}
              <div>
                <strong>{l.lot_acres.toFixed(2)}</strong>
                <span>Lot acres</span>
              </div>
            </div>
            <section className="property-description">
              <p className="eyebrow">A place for your next chapter</p>
              <h2>
                Thoughtfully situated.
                <br />
                Ready for what's next.
              </h2>
              <details open>
                <summary>About this property</summary>
                <p>{l.description}</p>
              </details>
            </section>
            <section className="features-section">
              <h2>Features & Amenities</h2>
              {(['interior', 'area_lot', 'exterior', 'financial'] as const).map((group, i) => (
                <details className="feature-accordion" key={group} open={i === 0}>
                  <summary>
                    {['Interior', 'Area & Lot', 'Exterior', 'Financial'][i]}
                    <span>+</span>
                  </summary>
                  <dl>
                    {l.listing_features
                      .filter((f) => f.group === group)
                      .map((f) => (
                        <div key={f.id}>
                          <dt>{f.label}</dt>
                          <dd>
                            {f.label.toLowerCase().includes('tax')
                              ? money(Number(f.value))
                              : f.value}
                          </dd>
                        </div>
                      ))}
                    {group === 'financial' && (
                      <div>
                        <dt>{l.listing_kind === 'rent' ? 'Monthly rent' : 'Sales price'}</dt>
                        <dd>{money(l.list_price)}</dd>
                      </div>
                    )}
                  </dl>
                </details>
              ))}
            </section>
            <ShowingScheduler listingId={l.id} address={l.address_line} />
            {l.listing_kind === 'sale' && (
              <MortgageCalculator price={l.list_price} tax={Number(l.raw.property_tax) || 0} />
            )}
          </div>
          {agent && (
            <aside className="property-agent">
              <div className="property-agent-photo">
                <Image
                  src={agent.photo_path}
                  alt={`Sample portrait representing ${agent.full_name}`}
                  fill
                  sizes="300px"
                />
                <span className="sample-caption">Sample portrait</span>
              </div>
              <p className="eyebrow">Your local connection</p>
              <h3>{agent.full_name}</h3>
              <p className="agent-title">{agent.title}</p>
              <a href={`tel:${agent.phone.replace(/\D/g, '')}`}>{agent.phone}</a>
              <a href={`mailto:${agent.email}`}>{agent.email}</a>
              <p className="demo-note">License # {agent.license_no}</p>
              <ContactButton
                extra={{ listing_id: l.id, agent_id: agent.id, gate_action: 'contact' }}
                message={`I'm interested in ${l.address_line}, ${l.city}, ${l.state} ${l.zip}.`}
              >
                CONTACT AGENT
              </ContactButton>
              <TextLink href={`/agent/${agent.slug}`}>
                Meet {agent.full_name.split(' ')[0]}
              </TextLink>
            </aside>
          )}
        </div>
        <section className="section-sm border-top">
          <SectionHeading
            eyebrow="Good neighbors. A great place to begin."
            title="The neighborhood"
          />
          {n && (
            <div className="split-layout">
              <div className="detail-neighborhood-image">
                <Image src={n.hero_path} alt={`Sample imagery for ${n.name}`} fill sizes="50vw" />
              </div>
              <div>
                <h3>{n.name}</h3>
                <p className="intro-copy mt-8">{n.blurb}</p>
                <TextLink href={`/neighborhoods/${n.slug}`} className="mt-8">
                  Explore {n.name}
                </TextLink>
                <a
                  className="text-link mt-8"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${l.address_line}, ${l.city}, ${l.state} ${l.zip}`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View property on Google Maps
                </a>
              </div>
            </div>
          )}
        </section>
        {similar.length > 0 && (
          <section className="section-sm">
            <SectionHeading title="Similar Properties" href="/properties/sale" />
            <div className="listing-grid">
              {similar.map((x) => (
                <ListingCard key={x.id} listing={x} />
              ))}
            </div>
          </section>
        )}
        <section className="idx-disclosure">
          <p>
            Courtesy of {l.courtesy_of}, {agent?.full_name}. Listing contact: {agent?.phone}.
          </p>
          <p>
            Broker Reciprocity: IDX information is provided exclusively for consumers' personal,
            non-commercial use and may not be used for any purpose other than to identify
            prospective properties consumers may be interested in purchasing. Information is deemed
            reliable but not guaranteed. All information should be independently verified. Some
            properties which appear for sale on this website may no longer be available.
          </p>
          <p>
            Prototype demonstration data. Licensed MLS copyright and brokerage-specific attribution
            must be supplied before live IDX use.
          </p>
          <p>
            Data last updated{' '}
            {new Date(l.synced_at).toLocaleString('en-US', { timeZone: 'America/Chicago' })}{' '}
            Central.
          </p>
        </section>
        <JsonLd
          value={{
            '@context': 'https://schema.org',
            '@type': 'RealEstateListing',
            name: l.address_line,
            description: l.description,
            url: `${env.NEXT_PUBLIC_SITE_URL}/properties/${l.slug}`,
            datePosted: l.created_at,
            mainEntity: {
              '@type': 'Residence',
              name: l.address_line,
              address: {
                '@type': 'PostalAddress',
                streetAddress: l.address_line,
                addressLocality: l.city,
                addressRegion: l.state,
                postalCode: l.zip,
                addressCountry: 'US',
              },
              numberOfRooms: l.beds,
              geo: { '@type': 'GeoCoordinates', latitude: l.lat, longitude: l.lng },
            },
            offers: {
              '@type': 'Offer',
              price: l.list_price,
              priceCurrency: 'USD',
              availability:
                l.status === 'sold' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
            },
          }}
        />
      </div>
    </article>
  );
}
