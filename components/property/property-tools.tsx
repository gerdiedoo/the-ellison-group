'use client';

import { useState } from 'react';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, Car, Bike, Footprints, GitCompareArrows, X } from 'lucide-react';
import type { Listing } from '@/lib/types';
import { money, number } from '@/lib/utils';

export type ComparisonHome = Pick<
  Listing,
  | 'id'
  | 'slug'
  | 'address_line'
  | 'list_price'
  | 'listing_kind'
  | 'property_type'
  | 'beds'
  | 'baths_full'
  | 'baths_half'
  | 'living_sqft'
  | 'lot_acres'
  | 'year_built'
>;

export function PropertyCompare({
  current,
  homes,
}: {
  current: ComparisonHome;
  homes: ComparisonHome[];
}) {
  const [selected, setSelected] = useState(homes[0]?.id || '');
  const other = homes.find((home) => home.id === selected);
  const rows: [string, (home: ComparisonHome) => string][] = [
    [
      'Price',
      (home) => `${money(home.list_price)}${home.listing_kind === 'rent' ? ' / month' : ''}`,
    ],
    ['Property type', (home) => home.property_type],
    ['Bedrooms', (home) => (home.property_type === 'Land' ? '—' : String(home.beds))],
    [
      'Bathrooms',
      (home) =>
        home.property_type === 'Land' ? '—' : String(home.baths_full + home.baths_half / 2),
    ],
    ['Living area', (home) => (home.living_sqft ? `${number(home.living_sqft)} sq.ft.` : '—')],
    ['Lot size', (home) => `${home.lot_acres.toFixed(2)} acres`],
    [
      'Year built',
      (home) => (home.property_type !== 'Land' && home.year_built ? String(home.year_built) : '—'),
    ],
    [
      'Price per sq.ft.',
      (home) => (home.living_sqft ? money(home.list_price / home.living_sqft) : '—'),
    ],
  ];
  return (
    <Dialog.Root>
      <Dialog.Trigger className="text-link">
        <GitCompareArrows size={16} />
        Compare this home
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="modal property-compare-modal">
          <Dialog.Title>See how homes compare.</Dialog.Title>
          <Dialog.Description className="intro-copy">
            Look at the details side by side to find what fits your next chapter.
          </Dialog.Description>
          {homes.length ? (
            <>
              <label className="comparison-select">
                Choose another property
                <select value={selected} onChange={(event) => setSelected(event.target.value)}>
                  {homes.map((home) => (
                    <option key={home.id} value={home.id}>
                      {home.address_line}
                    </option>
                  ))}
                </select>
              </label>
              {other && (
                <>
                  <div className="property-table-scroll">
                    <table className="property-data-table">
                      <caption className="sr-only">Property comparison</caption>
                      <thead>
                        <tr>
                          <th scope="col">Details</th>
                          <th scope="col">{current.address_line}</th>
                          <th scope="col">{other.address_line}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(([label, value]) => (
                          <tr key={label}>
                            <th scope="row">{label}</th>
                            <td>{value(current)}</td>
                            <td>{value(other)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Link className="text-link mt-8" href={`/properties/${other.slug}`}>
                    View {other.address_line}
                    <ArrowUpRight size={16} />
                  </Link>
                </>
              )}
            </>
          ) : (
            <p className="property-empty">
              There are no other properties available to compare right now.
            </p>
          )}
          <Dialog.Close className="property-modal-close" aria-label="Close comparison">
            <X size={22} />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function PropertyHistory({
  listing,
  annualTax,
}: {
  listing: Pick<
    Listing,
    | 'created_at'
    | 'synced_at'
    | 'status'
    | 'list_price'
    | 'sold_price'
    | 'sold_date'
    | 'listing_kind'
  >;
  annualTax: number;
}) {
  const [tab, setTab] = useState<'price' | 'tax'>('price');
  const date = (value: string) =>
    new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/Chicago',
    });
  return (
    <section className="property-extra-section" id="property-history">
      <p className="eyebrow">The story behind the price</p>
      <h2>Price & Tax History</h2>
      <div className="filter-tabs property-history-tabs" aria-label="History type">
        <button
          aria-pressed={tab === 'price'}
          className={tab === 'price' ? 'active' : ''}
          onClick={() => setTab('price')}
        >
          Price history
        </button>
        <button
          aria-pressed={tab === 'tax'}
          className={tab === 'tax' ? 'active' : ''}
          onClick={() => setTab('tax')}
        >
          Tax information
        </button>
      </div>
      {tab === 'price' ? (
        <div className="property-table-scroll">
          <table className="property-data-table">
            <caption className="sr-only">Recorded listing history</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Event</th>
                <th scope="col">Price</th>
              </tr>
            </thead>
            <tbody>
              {listing.status === 'sold' && listing.sold_date && listing.sold_price !== null && (
                <tr>
                  <td>{date(listing.sold_date)}</td>
                  <td>Sold</td>
                  <td>{money(listing.sold_price)}</td>
                </tr>
              )}
              <tr>
                <td>{date(listing.synced_at)}</td>
                <td>
                  {listing.listing_kind === 'rent' ? 'Latest monthly rent' : 'Latest asking price'}
                </td>
                <td>{money(listing.list_price)}</td>
              </tr>
            </tbody>
          </table>
          <p className="demo-note">
            This is the latest available listing record. Earlier price changes have not been
            provided.
          </p>
        </div>
      ) : (
        <div className="property-tax-card">
          <span>Reported annual property tax</span>
          <strong>{annualTax > 0 ? money(annualTax) : 'Not provided'}</strong>
          <p className="demo-note">
            Historical tax assessments have not been provided. Confirm the tax year, assessed value,
            and current amount with the county assessor.
          </p>
        </div>
      )}
    </section>
  );
}

export function PropertyCommute({ address }: { address: string }) {
  const [destination, setDestination] = useState('');
  const [mode, setMode] = useState('driving');
  return (
    <section className="property-extra-section" id="property-commute">
      <p className="eyebrow">Your everyday, considered</p>
      <h2>Transit & Commute</h2>
      <p className="property-section-copy">
        Explore the route from this property to the places in your day.
      </p>
      <div className="filter-tabs commute-modes" aria-label="Travel mode">
        {[
          { value: 'driving', label: 'Driving', Icon: Car },
          { value: 'bicycling', label: 'Biking', Icon: Bike },
          { value: 'walking', label: 'Walking', Icon: Footprints },
        ].map(({ value, label, Icon }) => (
          <button
            key={value}
            aria-pressed={mode === value}
            className={mode === value ? 'active' : ''}
            onClick={() => setMode(value)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
      <form
        className="property-commute-form"
        action="https://www.google.com/maps/dir/"
        target="_blank"
        rel="noreferrer"
      >
        <input type="hidden" name="api" value="1" />
        <input type="hidden" name="origin" value={address} />
        <input type="hidden" name="travelmode" value={mode} />
        <label htmlFor="commute-destination">Where do you commute to?</label>
        <div>
          <input
            id="commute-destination"
            name="destination"
            placeholder="Enter an address or destination"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            required
          />
          <button className="button" type="submit" disabled={!destination.trim()}>
            View route
            <ArrowUpRight size={16} />
          </button>
        </div>
      </form>
      <p className="demo-note">Routes and current travel times open in Google Maps in a new tab.</p>
    </section>
  );
}
