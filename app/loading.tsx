'use client';
import { usePathname } from 'next/navigation';
import { HomeHero } from '@/components/sections/home-hero';
export default function Loading() {
  const home = usePathname() === '/';
  return home ? (
    <div aria-busy="true" aria-label="Loading page">
      <HomeHero />
      <p className="sr-only" role="status">
        Loading our local perspective…
      </p>
    </div>
  ) : (
    <div className="container page-hero" aria-busy="true" aria-label="Loading page">
      <div className="loading-skeleton" />
      <p className="sr-only" role="status">
        Finding your next chapter…
      </p>
    </div>
  );
}
