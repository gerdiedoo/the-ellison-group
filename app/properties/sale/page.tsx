import { Suspense } from 'react';
import { getListings,getNeighborhoods } from '@/lib/data';
import { PageHero } from '@/components/ui/primitives';
import { SearchSurface } from '@/components/search/search-surface';
export const metadata={title:'Featured Properties | The Ellison Group',alternates:{canonical:'/properties/sale'}};
export const dynamic='force-dynamic';
export default async function Sale(){const[listings,neighborhoods]=await Promise.all([getListings(),getNeighborhoods()]);return <><PageHero eyebrow="Find your place" title="Featured Properties" description="Browse our exclusive listings."/><section className="container section-sm"><Suspense><SearchSurface listings={listings} neighborhoods={neighborhoods} mode="sale"/></Suspense></section></>;}
