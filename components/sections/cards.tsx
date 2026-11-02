import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { TextLink } from '@/components/ui/primitives';
import type { Agent, Neighborhood, BlogPost } from '@/lib/types';
export function AgentCard({ agent: a }: { agent: Agent }) {
  return (
    <article className="agent-card">
      <Link href={`/agent/${a.slug}`} className="agent-photo">
        <Image src={a.photo_path} alt={a.full_name} fill sizes="(max-width:600px) 75vw,25vw" />
        <span className="card-view">
          Meet {a.full_name.split(' ')[0]}
          <ArrowUpRight size={15} />
        </span>
      </Link>
      <div className="agent-info">
        <h3>
          <Link href={`/agent/${a.slug}`}>{a.full_name}</Link>
        </h3>
        <p>{a.title}</p>
        <Link
          href={`/agent/${a.slug}`}
          aria-label={`Learn more about ${a.full_name}`}
          className="agent-arrow"
        >
          <ArrowUpRight size={21} />
        </Link>
      </div>
    </article>
  );
}
export function NeighborhoodCard({ neighborhood: n }: { neighborhood: Neighborhood }) {
  return (
    <Link className="neighborhood-card" href={`/neighborhoods/${n.slug}`}>
      <Image
        src={n.hero_path}
        alt={`Sample lifestyle photography for the ${n.name} neighborhood guide`}
        fill
        sizes="(max-width:600px) 100vw,(max-width:960px) 50vw,33vw"
      />
      <div className="neighborhood-caption">
        <h3>{n.name}</h3>
        <span>
          Learn More
          <ArrowUpRight size={16} />
        </span>
      </div>
    </Link>
  );
}
export function BlogCard({ post: p }: { post: BlogPost }) {
  return (
    <article className="blog-card">
      <Link className="blog-image" href={`/blog/${p.slug}`}>
        <Image
          src={p.cover_path}
          alt={`Sample editorial photography for ${p.title}`}
          fill
          sizes="(max-width:600px) 100vw,33vw"
        />
        <span className="badge">{p.status === 'draft' ? 'Draft preview' : p.category}</span>
      </Link>
      <p className="eyebrow">
        {p.category} <span>·</span> Little Rock living
      </p>
      <h3>
        <Link href={`/blog/${p.slug}`}>{p.title}</Link>
      </h3>
      <p className="muted">{p.excerpt}</p>
      <TextLink href={`/blog/${p.slug}`}>Read the story</TextLink>
    </article>
  );
}
