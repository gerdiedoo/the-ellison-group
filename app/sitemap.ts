import type { MetadataRoute } from 'next';
import { env,isDev } from '@/lib/env';
import { navigation } from '@/lib/site';
import { getAgents,getListings,getNeighborhoods,getPosts } from '@/lib/data';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{if(isDev)return[];const[agents,listings,neighborhoods,posts]=await Promise.all([getAgents(),getListings(),getNeighborhoods(),getPosts()]);const paths=[...navigation.map(([,u])=>u).filter(u=>u!=='/home-search/account'),'/terms-and-conditions',...agents.map(a=>`/agent/${a.slug}`),...listings.map(l=>`/properties/${l.slug}`),...neighborhoods.map(n=>`/neighborhoods/${n.slug}`),...posts.filter(p=>p.status==='published').map(p=>`/blog/${p.slug}`)];return[...new Set(paths)].map(path=>({url:`${env.NEXT_PUBLIC_SITE_URL}${path}`,changeFrequency:path==='/'?'weekly':'monthly',priority:path==='/'?1:.7}));}
