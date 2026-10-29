import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getNeighborhoods,getListings } from '@/lib/data';
import { all } from '@/lib/repository';
import { PageHero,SectionHeading,ButtonLink } from '@/components/ui/primitives';
import { NeighborhoodCard } from '@/components/sections/cards';
import { NeighborhoodData } from '@/components/neighborhood/guide-data';
import { SearchSurface } from '@/components/search/search-surface';
import { metadata } from '@/lib/seo';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const{slug}=await params,n=(await getNeighborhoods()).find(n=>n.slug===slug);return metadata(`${n?.name||'Little Rock'} Real Estate and Neighborhood`,`/neighborhoods/${slug}`,n?.blurb);}
export default async function Guide({params}:{params:Promise<{slug:string}>}){const{slug}=await params;const[neighborhoods,listings,stats,pois,schools]=await Promise.all([getNeighborhoods(),getListings(),all('neighborhood_stats'),all('neighborhood_pois'),all('schools')]);const n=neighborhoods.find(n=>n.slug===slug);if(!n)notFound();return <><PageHero eyebrow="A little local perspective" title={`Explore ${n.name}, AR Real Estate and Neighborhood`} description={n.blurb}/><div className="container"><div className="neighborhood-hero-image"><Image src={n.hero_path} alt={`Sample lifestyle photograph for ${n.name}`} fill priority sizes="90vw"/></div><section className="section-sm"><SectionHeading title="Property Listings"/><Suspense><SearchSurface listings={listings.filter(l=>l.neighborhood_id===n.id)} neighborhoods={neighborhoods}/></Suspense><ButtonLink href={`/home-search/listings?region=${n.slug}`} className="mt-8">Search Homes</ButtonLink></section><NeighborhoodData name={n.name} stats={stats.find(s=>s.neighborhood_id===n.id)} pois={pois.filter(p=>p.neighborhood_id===n.id)} schools={schools.filter(s=>s.neighborhood_id===n.id)}/><section className="section-sm border-top"><SectionHeading title="Explore Other Neighborhoods" href="/neighborhoods"/><div className="other-neighborhood-grid">{neighborhoods.filter(x=>x.id!==n.id).slice(0,4).map(x=><NeighborhoodCard key={x.id} neighborhood={x}/>)}</div></section></div></>;}
