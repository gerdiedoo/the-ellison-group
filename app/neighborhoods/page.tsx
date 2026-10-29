import { getNeighborhoods } from '@/lib/data';
import { PageHero } from '@/components/ui/primitives';
import { NeighborhoodCard } from '@/components/sections/cards';
import { metadata } from '@/lib/seo';
export const generateMetadata=()=>metadata('Neighborhood Guides','/neighborhoods');
export const dynamic='force-dynamic';
export default async function Neighborhoods(){const items=await getNeighborhoods();return <><PageHero eyebrow="Find your kind of local" title="Neighborhood Guides" description="Find the right neighborhood for your lifestyle."/><section className="container section-sm"><div className="neighborhood-grid">{items.map(n=><div key={n.id}><NeighborhoodCard neighborhood={n}/><p className="neighborhood-blurb">{n.blurb}</p></div>)}</div></section></>;}
