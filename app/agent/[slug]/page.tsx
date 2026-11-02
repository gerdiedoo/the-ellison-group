import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getAgents, getTestimonials, getListings } from '@/lib/data';
import { ContactButton } from '@/components/shell/site-provider';
import { Testimonials } from '@/components/sections/testimonials';
import { SectionHeading } from '@/components/ui/primitives';
import { ListingCard } from '@/components/search/listing-card';
import { SearchCta } from '@/components/sections/search-cta';
import { site } from '@/lib/site';
import { metadata } from '@/lib/seo';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params,
    a = (await getAgents()).find((a) => a.slug === slug);
  return metadata(a?.full_name || 'Meet the Team', `/agent/${slug}`);
}
export default async function Agent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [agents, testimonials, listings] = await Promise.all([
    getAgents(),
    getTestimonials(),
    getListings(),
  ]);
  const a = agents.find((a) => a.slug === slug);
  if (!a) notFound();
  return (
    <>
      <section className="agent-profile container">
        <div className="profile-photo">
          <Image
            src={a.photo_path}
            alt={a.full_name}
            fill
            priority
            sizes="(max-width:700px) 90vw,40vw"
          />
        </div>
        <div>
          <p className="eyebrow">The Ellison Group</p>
          <h1>{a.full_name}</h1>
          <p className="agent-profile-title">{a.title}</p>
          <ContactButton message={`I'd like to connect with ${a.full_name}.`}>
            Contact {a.full_name.split(' ')[0]}
          </ContactButton>
          <div className="profile-details">
            <h3>About {a.full_name}</h3>
            <dl>
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${a.email}`}>{a.email}</a>
                </dd>
              </div>
              <div>
                <dt>Mobile</dt>
                <dd>
                  <a href={site.phone_href}>{a.phone}</a>
                </dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{site.address}</dd>
              </div>
              <div>
                <dt>License #</dt>
                <dd>{a.license_no}</dd>
              </div>
            </dl>
            <div className="social-links">
              {Object.entries(a.socials).map(([n, u]) => (
                <a key={n} href={u} target="_blank" rel="noreferrer">
                  {n} ↗
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="container section-sm prose">
        <p className="eyebrow">A personal introduction</p>
        <h2>Meet {a.full_name.split(' ')[0]}</h2>
        <p>{a.bio}</p>
        {a.slug === 'kerry-ellison' && (
          <p>
            Licensed since 1994, with a career spanning over 30 years. Biography details supplied in
            the project brief; full client-approved copy is pending.
          </p>
        )}
      </section>
      <Testimonials items={testimonials.filter((t) => t.agent_id === a.id)} />
      <section className="container section">
        <SectionHeading title="Featured Properties" href="/properties/sale" />
        <div className="listing-grid">
          {listings
            .filter((l) => l.listing_agent_id === a.id && l.status !== 'sold')
            .slice(0, 3)
            .map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
        </div>
      </section>
      <SearchCta />
    </>
  );
}
