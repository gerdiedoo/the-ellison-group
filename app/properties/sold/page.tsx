import { Suspense } from 'react';
import { getListings,getNeighborhoods } from '@/lib/data';
import { PageHero } from '@/components/ui/primitives';
import { SearchSurface } from '@/components/search/search-surface';
export const metadata={title:'Past Transactions | The Ellison Group',alternates:{canonical:'/properties/sold'}};
export const dynamic='force-dynamic';
export default async function Sold(){const[listings,neighborhoods]=await Promise.all([getListings(),getNeighborhoods()]);return <><PageHero eyebrow="Every move has a story" title="Past Transactions" description="A look at chapters closed and new beginnings made."/><section className="container section-sm"><Suspense><SearchSurface listings={listings} neighborhoods={neighborhoods} mode="sold"/></Suspense></section></>;}
