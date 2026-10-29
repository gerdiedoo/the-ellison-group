import { PageHero } from '@/components/ui/primitives';
import { getTestimonials,getAgents } from '@/lib/data';
import { ReviewGrid } from '@/components/team/review-grid';
import { JsonLd } from '@/components/ui/json-ld';
import { site } from '@/lib/site';
export const metadata={title:'Testimonials | The Ellison Group',alternates:{canonical:'/testimonials'}};
export const dynamic='force-dynamic';
export default async function Reviews(){const[items,agents]=await Promise.all([getTestimonials(),getAgents()]);const real=items.filter(i=>i.source!=='placeholder'&&i.rating);return <><PageHero eyebrow="Good words. Lasting relationships." title="Our Testimonials" description="See why our clients love working with us."/><section className="container section-sm"><ReviewGrid items={items} agents={agents}/><a className="text-link mt-8" href={site.socials['Google reviews']} target="_blank" rel="noreferrer">Leave a review</a><p className="demo-note">[PLACEHOLDER] These are layout samples, not reviews from real clients. Verified full testimonials are awaiting approval.</p></section>{real.length>0&&<JsonLd value={{'@context':'https://schema.org','@type':'RealEstateAgent',name:site.name,aggregateRating:{'@type':'AggregateRating',ratingValue:real.reduce((n,t)=>n+t.rating!,0)/real.length,reviewCount:real.length},review:real.map(t=>({'@type':'Review',author:{'@type':'Person',name:t.reviewer_name},reviewBody:t.body,reviewRating:{'@type':'Rating',ratingValue:t.rating}}))}}/>}</>;}
