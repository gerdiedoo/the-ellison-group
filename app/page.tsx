import Image from 'next/image';
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check } from 'lucide-react';
import { getAgents, getFeatured, getNeighborhoods, getTestimonials, getPosts } from '@/lib/data';
import { site } from '@/lib/site';
import { CountUp } from '@/components/motion/reveal';
import { TextLink, SectionHeading, DemoNote } from '@/components/ui/primitives';
import { HomeHero } from '@/components/sections/home-hero';
import { ContactButton } from '@/components/shell/site-provider';
import { AgentCard, NeighborhoodCard, BlogCard } from '@/components/sections/cards';
import { Testimonials } from '@/components/sections/testimonials';
import { ListingCard } from '@/components/search/listing-card';
import { ValuationForm } from '@/components/forms/valuation-form';
import { NewsletterForm } from '@/components/forms/newsletter-form';
import { money } from '@/lib/utils';
import './home.css';
export const dynamic = 'force-dynamic';
export default function Home() {
  return (
    <>
      <HomeHero />
      <Suspense
        fallback={
          <div className="container section" role="status">
            Loading our local perspective…
          </div>
        }
      >
        <HomeSections />
      </Suspense>
    </>
  );
}

async function HomeSections() {
  const [agents, featured, neighborhoods, testimonials, posts] = await Promise.all([
    getAgents(),
    getFeatured(),
    getNeighborhoods(),
    getTestimonials(),
    getPosts(),
  ]);
  const kerry = agents[0];
  return (
    <>
      <section className="container home-intro" id="our-story">
        <div className="intro-grid">
          <p className="eyebrow intro-kicker">
            <span />
            More than a move
          </p>
          <div>
            <h2>
              Your Partners in
              <br className="desktop-only" /> Real Estate Success
            </h2>
            <p className="intro-copy">
              A new home. A fresh start. A familiar neighborhood seen in a new light. With deep
              Little Rock roots and a personal approach, we bring clarity and care to every step of
              your real estate journey.
            </p>
            <div className="stats-row">
              {site.stats.map((s) => (
                <div className="stat" key={s.label}>
                  <p>
                    <CountUp {...s} />
                  </p>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="container guide-triptych" aria-label="Real estate guides">
        <Link href="/buyers-guide" className="guide-photo-card">
          <Image
            src="/seed/house-3.jpg"
            alt="Sunlit demonstration home with an inviting garden"
            fill
            sizes="40vw"
          />
          <div className="guide-card-caption">
            <div>
              <p className="eyebrow">Find your next beginning</p>
              <h3>Buyer's Guide</h3>
            </div>
            <ArrowUpRight size={25} />
          </div>
        </Link>
        <div className="guide-contact">
          <span className="guide-emblem" aria-hidden="true">
            E
          </span>
          <p className="eyebrow">A conversation away</p>
          <h3>Contact Us</h3>
          <p>
            Big plans or a simple question.
            <br />
            We're here for what's next.
          </p>
          <ContactButton className="text-link">Let's connect</ContactButton>
        </div>
        <Link href="/sellers-guide" className="guide-photo-card">
          <Image
            src="/seed/interior.jpg"
            alt="Airy living room with natural textures and warm light"
            fill
            sizes="40vw"
          />
          <div className="guide-card-caption">
            <div>
              <p className="eyebrow">Make your next move count</p>
              <h3>Seller's Guide</h3>
            </div>
            <ArrowUpRight size={25} />
          </div>
        </Link>
      </section>
      {kerry && (
        <section className="featured-agent">
          <div className="container featured-agent-inner">
            <div className="featured-agent-photo">
              <Image
                src={kerry.photo_path}
                alt="Kerry Ellison"
                fill
                sizes="(max-width:600px) 100vw,40vw"
              />
            </div>
            <div className="featured-agent-copy">
              <p className="eyebrow">Experience you can feel at home with</p>
              <h2>Kerry Ellison</h2>
              <p className="agent-title">Principal Broker | Real Estate Agent</p>
              <p className="intro-copy">
                With a career spanning over 30 years and licensed since 1994, Kerry brings a steady
                perspective to the moments that matter. Her approach begins with listening—and a
                belief that the best moves start with understanding what home means to you.
              </p>
              <p className="demo-note">[PLACEHOLDER] Biography awaiting client approval.</p>
              <TextLink href="/agent/kerry-ellison">Meet Kerry Ellison</TextLink>
              <p className="agent-signature" aria-hidden="true">
                Kerry Ellison
              </p>
            </div>
          </div>
        </section>
      )}
      <section className="container section">
        <SectionHeading
          eyebrow="The people behind your next chapter"
          title="Our Team"
          subtitle="Local perspective. Personal attention. A team in your corner."
          href="/team"
        />
        <div className="agent-grid">
          {agents.map((a) => (
            <AgentCard key={a.id} agent={a} />
          ))}
        </div>
      </section>
      <Testimonials items={testimonials} />
      <section className="container section">
        <SectionHeading
          eyebrow="Considered homes. Exceptional possibilities."
          title="Featured Properties"
          subtitle="Browse our exclusive listings."
          href="/properties/sale"
        />
        <div className="featured-listings">
          {featured
            .filter((l) => l.property_type !== 'Land')
            .slice(0, 3)
            .map((l, i) => (
              <ListingCard key={l.id} listing={l} hero={i === 0} />
            ))}
        </div>
        <div className="land-row">
          <p className="eyebrow">Land & possibilities</p>
          {featured
            .filter((l) => l.property_type === 'Land')
            .slice(0, 2)
            .map((l) => (
              <Link key={l.id} href={`/properties/${l.slug}`}>
                <span>{l.address_line}</span>
                <strong>{money(l.list_price)}</strong>
                <ArrowUpRight size={15} />
              </Link>
            ))}
        </div>
        <DemoNote />
      </section>
      <section className="valuation-home">
        <div className="container split-layout">
          <div>
            <p className="eyebrow">Know your home's next chapter</p>
            <h2>
              Get your instant
              <br />
              home valuation
            </h2>
            <p className="muted">Enter your details to see how much your home is worth.</p>
            <ValuationForm />
            <div className="benefits">
              {['Instant result', 'Sell for more', 'Get expert advice'].map((b) => (
                <span key={b}>
                  <Check size={13} />
                  {b}
                </span>
              ))}
            </div>
          </div>
          <div className="valuation-agent-panel">
            <div className="valuation-agent-top">
              <div>
                <Image
                  src={kerry?.photo_path || '/team/kerry.avif'}
                  alt="Kerry Ellison"
                  fill
                  sizes="100px"
                />
              </div>
              <div>
                <h3>Kerry Ellison</h3>
                <p>Principal Broker | Real Estate Agent</p>
              </div>
            </div>
            <p className="muted">
              A number is a starting point. Local perspective tells the whole story. Get a
              thoughtful, personal look at your home's potential.
            </p>
            <ContactButton className="text-link">Schedule a Consultation</ContactButton>
            <div className="valuation-agent-tags">
              <span>✓ Trusted agent</span>
              <span>✓ Local expert</span>
              <span>✓ Prompt response</span>
            </div>
          </div>
        </div>
      </section>
      <section className="container section">
        <SectionHeading
          eyebrow="Find your kind of local"
          title="Neighborhood Guides"
          subtitle="Find the right neighborhood for your lifestyle."
          href="/neighborhoods"
        />
        <div className="neighborhood-grid">
          {neighborhoods.slice(0, 6).map((n) => (
            <NeighborhoodCard key={n.id} neighborhood={n} />
          ))}
        </div>
      </section>
      <section className="newsletter-section">
        <div className="container newsletter-layout">
          <div>
            <p className="eyebrow">A local perspective, delivered</p>
            <h2>
              The Ellison Group
              <br />
              Market Review
            </h2>
            <p className="muted">
              Your monthly look at Little Rock real estate. Market insights,
              <br className="desktop-only" /> neighborhood notes, and a little local inspiration.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </section>
      <section className="container section">
        <SectionHeading
          eyebrow="Life beyond the front door"
          title="Blog Posts"
          subtitle="Helpful tips, local insights, and the latest real estate trends."
          href="/blog"
        />
        <div className="blog-grid">
          {posts.slice(0, 3).map((p) => (
            <BlogCard key={p.id} post={p} />
          ))}
        </div>
        <DemoNote>Editorial draft previews · client-approved stories coming soon.</DemoNote>
      </section>
    </>
  );
}
