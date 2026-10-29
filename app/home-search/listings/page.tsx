import { Suspense } from 'react';
import { getListings,getNeighborhoods } from '@/lib/data';
import { SearchSurface } from '@/components/search/search-surface';
import type { Metadata } from 'next';
export const metadata:Metadata={title:'Home Search | The Ellison Group',description:'Explore Little Rock homes by neighborhood, price, or your own map boundary.',alternates:{canonical:'/home-search/listings'}};
export const dynamic='force-dynamic';
export default async function SearchPage(){const[listings,neighborhoods]=await Promise.all([getListings(),getNeighborhoods()]);return <section className="search-page container"><Suspense fallback={<div className="loading-skeleton"/>}><SearchSurface listings={listings} neighborhoods={neighborhoods}/></Suspense></section>;}
