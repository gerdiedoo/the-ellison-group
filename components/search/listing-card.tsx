'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { Heart, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Listing } from '@/lib/types';
import { money, number, cn } from '@/lib/utils';
import { useSite } from '@/components/shell/site-provider';
export function SaveHome({ id }: { id: string }) {
  const [saved, setSaved] = useState(false);
  const { toast } = useSite();
  useEffect(() => {
    const update = () => {
      let ids: string[] = [];
      try {
        ids = JSON.parse(localStorage.getItem('ellison-homes') || '[]') as string[];
      } catch {
        localStorage.removeItem('ellison-homes');
      }
      setSaved(ids.includes(id));
    };
    update();
    window.addEventListener('savedhomes', update);
    return () => window.removeEventListener('savedhomes', update);
  }, [id]);
  const toggle = useCallback(
    async (skipCheck = false) => {
      try {
        if (!saved && !skipCheck) {
          const check = await fetch(`/api/capture/check?listing_id=${id}&action=save`);
          if (!check.ok) throw new Error('We could not verify this property. Please try again.');
          if (((await check.json()) as { required: boolean }).required) {
            window.dispatchEvent(
              new CustomEvent('ellison-capture', { detail: { listing_id: id, action: 'save' } }),
            );
            return;
          }
        }
        const ids = JSON.parse(localStorage.getItem('ellison-homes') || '[]') as string[];
        const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
        localStorage.setItem('ellison-homes', JSON.stringify(next));
        setSaved(!saved);
        window.dispatchEvent(new Event('savedhomes'));
        const r = await fetch('/api/portal/homes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listing_id: id, saved: !saved }),
        });
        if (!r.ok && r.status !== 401) {
          toast('Saved on this device. Account sync could not be completed.');
          return;
        }
        if (r.status === 401 && !sessionStorage.getItem('ellison-save-prompt')) {
          sessionStorage.setItem('ellison-save-prompt', '1');
          toast('Home saved on this device. Sign in to My Search Portal to sync.');
        } else toast(saved ? 'Home removed from your collection.' : 'Saved to your collection.');
      } catch (e) {
        toast(
          e instanceof Error ? e.message : 'We could not save this property. Please try again.',
        );
      }
    },
    [id, saved, toast],
  );
  useEffect(() => {
    const resume = (event: Event) => {
      const value = (event as CustomEvent<{ listing_id: string; action: string }>).detail;
      if (value.listing_id === id && value.action === 'save') void toggle(true);
    };
    window.addEventListener('ellison-capture-complete', resume);
    return () => window.removeEventListener('ellison-capture-complete', resume);
  }, [id, toggle]);
  return (
    <button
      className={cn('save-home', saved && 'saved')}
      aria-label={saved ? 'Remove saved home' : 'Save home'}
      aria-pressed={saved}
      onClick={() => toggle()}
    >
      <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
    </button>
  );
}
export function ListingCard({
  listing: l,
  hero = false,
  carousel = false,
}: {
  listing: Listing;
  hero?: boolean;
  carousel?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const photos = l.listing_photos;
  const photo = photos[index] || photos[0];
  return (
    <article className={cn('listing-card', hero && 'listing-hero')}>
      <div className="listing-image">
        <Link href={`/properties/${l.slug}`} aria-label={`View ${l.address_line}`}>
          <Image
            src={photo?.url || '/seed/hero.jpg'}
            alt={`${l.address_line} · sample ${photo?.caption || 'home exterior'}`}
            fill
            sizes={
              hero
                ? '(max-width:700px) 100vw,60vw'
                : '(max-width:600px) 100vw,(max-width:960px) 50vw,33vw'
            }
            style={{ viewTransitionName: `listing-${l.id}` }}
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSI2Ij48cGF0aCBmaWxsPSIjZTdlMGQzIiBkPSJNMCAwaDEwdjZIMHoiLz48L3N2Zz4="
          />
        </Link>
        <span className={cn('badge listing-status', l.status)}>
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
        <SaveHome id={l.id} />
        {carousel && (
          <div className="card-photo-controls">
            <button
              aria-label="Previous property photo"
              onClick={() => setIndex((index + photos.length - 1) % photos.length)}
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              {index + 1} / {photos.length}
            </span>
            <button
              aria-label="Next property photo"
              onClick={() => setIndex((index + 1) % photos.length)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
        <span className="card-view">
          View property
          <ArrowUpRight size={15} />
        </span>
      </div>
      <Link className="listing-info" href={`/properties/${l.slug}`}>
        <div className="listing-topline">
          <p>
            {l.city}, {l.state}
          </p>
          <ArrowUpRight size={17} />
        </div>
        <h3>{l.address_line}</h3>
        {l.property_type !== 'Land' && (
          <p className="listing-specs">
            {l.beds} Beds <span /> {l.baths_full + l.baths_half * 0.5} Baths <span />{' '}
            {number(l.living_sqft)} Sq.Ft.
          </p>
        )}
        <p className="listing-price">
          {money(l.status === 'sold' && l.sold_price ? l.sold_price : l.list_price)}
          {l.listing_kind === 'rent' ? ' / month' : ''}
        </p>
        {carousel && <p className="listing-mls">MLS® {l.mls_id} · Sample listing</p>}
      </Link>
    </article>
  );
}
