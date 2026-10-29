import { currentUser } from '@/lib/auth';
import { all } from '@/lib/repository';
import { getListings } from '@/lib/data';
import { PageHero,EmptyState } from '@/components/ui/primitives';
import { AuthPanel } from '@/components/portal/auth-panel';
import { ListingCard } from '@/components/search/listing-card';
export const metadata={title:'Saved Homes | The Ellison Group',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function SavedHomes(){const user=await currentUser();if(!user)return <><PageHero eyebrow="Keep your possibilities close" title="Saved Homes"/><section className="container section-sm"><AuthPanel/></section></>;const saved=(await all('saved_homes')).filter(h=>h.user_id===user.id),listings=(await getListings()).filter(l=>saved.some(h=>h.listing_id===l.id));return <><PageHero eyebrow="A collection of possibilities" title="Saved Homes" description={`${listings.length} homes, and a little closer to your next chapter.`}/><section className="container section-sm">{listings.length?<div className="listing-grid">{listings.map(l=><ListingCard key={l.id} listing={l}/>)}</div>:<EmptyState title="A home worth coming back to." body="Tap the heart on any property to keep it here." href="/home-search/listings" action="Find a home"/>}</section></>;}
