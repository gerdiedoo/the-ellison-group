import { PageHero,SectionHeading } from '@/components/ui/primitives';
import { TeamGrid } from '@/components/team/team-grid';
import { Testimonials } from '@/components/sections/testimonials';
import { ListingCard } from '@/components/search/listing-card';
import { SearchCta } from '@/components/sections/search-cta';
import { getAgents,getTestimonials,getListings } from '@/lib/data';
import { metadata } from '@/lib/seo';
export const generateMetadata=()=>metadata('Meet the Team','/team');
export const dynamic='force-dynamic';
export default async function Team(){const[agents,testimonials,listings]=await Promise.all([getAgents(),getTestimonials(),getListings()]);return <><PageHero eyebrow="The Ellison Group" title="Meet the Team" description="Our team is dedicated to supporting you through every step of your real estate journey—with honesty, communication, and a genuine desire to help you feel at home."/><section className="container section-sm"><TeamGrid agents={agents}/></section><Testimonials items={testimonials}/><section className="container section"><SectionHeading title="Past Transactions" href="/properties/sold"/><div className="listing-grid">{listings.filter(l=>l.status==='sold').slice(0,3).map(l=><ListingCard key={l.id} listing={l}/>)}</div></section><SearchCta/></>;}
