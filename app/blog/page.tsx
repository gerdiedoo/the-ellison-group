import Image from 'next/image';
import { getPosts } from '@/lib/data';
import { PageHero,ButtonLink } from '@/components/ui/primitives';
import { BlogIndex } from '@/components/blog/blog-index';
export const metadata={title:'Blog | The Ellison Group',alternates:{canonical:'/blog'}};
export const dynamic='force-dynamic';
export default async function Blog(){const posts=await getPosts();return <><PageHero eyebrow="Life beyond the front door" title="Local stories. A little perspective." description="Helpful tips, local insights, and the latest real estate trends."/>{posts[0]&&<section className="container blog-feature"><div><Image src={posts[0].cover_path} alt={`Sample editorial image for ${posts[0].title}`} fill priority sizes="60vw"/></div><article><p className="eyebrow">Featured story · {posts[0].status==='draft'?'Draft preview':posts[0].category}</p><h2>{posts[0].title}</h2><p>{posts[0].excerpt}</p><ButtonLink href={`/blog/${posts[0].slug}`} className="mt-8">Read the story</ButtonLink></article></section>}<section className="container section"><BlogIndex posts={posts}/></section></>;}
