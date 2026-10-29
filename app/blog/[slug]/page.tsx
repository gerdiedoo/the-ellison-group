import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getPosts,getAgents } from '@/lib/data';
import { PageHero,SectionHeading,DemoNote } from '@/components/ui/primitives';
import { Share } from '@/components/property/share';
import { NewsletterForm } from '@/components/forms/newsletter-form';
import { BlogCard } from '@/components/sections/cards';
import { Markdown } from '@/components/blog/markdown';
import { JsonLd } from '@/components/ui/json-ld';
import { metadata } from '@/lib/seo';
import { env } from '@/lib/env';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const{slug}=await params,p=(await getPosts()).find(p=>p.slug===slug);return metadata(p?.title||'Blog',`/blog/${slug}`,p?.excerpt);}
export default async function Post({params}:{params:Promise<{slug:string}>}){const{slug}=await params;const[posts,agents]=await Promise.all([getPosts(),getAgents()]);const p=posts.find(p=>p.slug===slug);if(!p)notFound();const author=agents.find(a=>a.id===p.author_id);return <><PageHero eyebrow={`${p.category} · Little Rock living`} title={p.title} description={p.excerpt}/><div className="container"><div className="article-meta"><p>{author?.full_name||'The Ellison Group'} · {Math.max(1,Math.ceil(p.body_md.split(/\s+/).length/200))} min read · {p.published_at?.slice(0,10)||'Draft preview'}</p><Share title={p.title}/></div><div className="article-hero"><Image src={p.cover_path} alt={`Sample photograph for ${p.title}`} fill priority sizes="90vw"/></div><article className="article-body"><Markdown text={p.body_md}/>{p.status==='draft'&&<DemoNote>[PLACEHOLDER] This unpublished editorial draft is visible only in the mock prototype. Client-approved content, dates, and source details are pending.</DemoNote>}</article><section className="section-sm"><SectionHeading title="A little more local" href="/blog"/><div className="blog-grid">{posts.filter(x=>x.id!==p.id).slice(0,3).map(x=><BlogCard key={x.id} post={x}/>)}</div></section></div><section className="newsletter-section"><div className="container newsletter-layout"><div><p className="eyebrow">Stay in the know</p><h2>The Ellison Group Market Review</h2></div><NewsletterForm/></div></section>{p.status==='published'&&<JsonLd value={{'@context':'https://schema.org','@type':'BlogPosting',headline:p.title,datePublished:p.published_at,dateModified:p.updated_at,author:{'@type':'Person',name:author?.full_name||'The Ellison Group'},image:`${env.NEXT_PUBLIC_SITE_URL}${p.cover_path}`,articleBody:p.body_md}}/>}</>;}
