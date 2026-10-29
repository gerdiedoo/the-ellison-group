import Link from 'next/link';
import { navigation } from '@/lib/site';
import { PageHero } from '@/components/ui/primitives';
import { getAgents,getNeighborhoods,getPosts } from '@/lib/data';
export const metadata={title:'Sitemap | The Ellison Group',alternates:{canonical:'/sitemap'}};
export const dynamic='force-dynamic';
export default async function Sitemap(){const[agents,neighborhoods,posts]=await Promise.all([getAgents(),getNeighborhoods(),getPosts()]);return <><PageHero eyebrow="Find your way" title="Sitemap"/><nav className="container sitemap-grid section-sm" aria-label="HTML sitemap">{[['Explore',navigation],['Our team',agents.map(a=>[a.full_name,`/agent/${a.slug}`])],['Neighborhoods',neighborhoods.map(n=>[n.name,`/neighborhoods/${n.slug}`])],['Local stories',posts.map(p=>[p.title,`/blog/${p.slug}`])],['Your account',[['Saved Homes','/home-search/saved/my-homes'],['My Search Portal','/home-search/account'],['Privacy Policy / Terms','/terms-and-conditions']]]].map(([title,links])=><div key={title as string}><h3>{title as string}</h3>{(links as readonly (readonly string[])[]).map(([label,href])=><Link href={href} key={href}>{label} ↗</Link>)}</div>)}</nav></>;}
