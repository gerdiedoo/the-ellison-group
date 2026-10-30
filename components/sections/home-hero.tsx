import Image from 'next/image';
import { ArrowDown, ArrowRight, Search } from 'lucide-react';
import { ButtonLink } from '@/components/ui/primitives';

export function HomeHero() {
  return (
    <section className="home-hero">
      <Image
        src="/seed/hero.jpg"
        alt="Sample architectural photography: a welcoming home opening onto a lush garden"
        fill
        priority
        quality={85}
        sizes="100vw"
        className="hero-photo"
      />
      <div className="hero-shade" />
      <div className="container hero-content">
        <p className="eyebrow">Trusted Local Real Estate Team</p>
        <h1>
          The Ellison<span>Group</span>
        </h1>
        <p className="hero-subline">Let's Find Your Dream Home</p>
        <div className="hero-actions">
          <ButtonLink href="/home-search/listings">Home Search</ButtonLink>
          <ButtonLink href="/home-valuation" outline>
            Home Valuation
          </ButtonLink>
        </div>
      </div>
      <span className="hero-caption">A sense of place. A place to call home.</span>
      <div className="container hero-foot">
        <form className="hero-search" action="/home-search/listings">
          <Search size={17} />
          <label className="sr-only" htmlFor="hero-search">
            Search by address, city, or neighborhood
          </label>
          <input id="hero-search" name="q" placeholder="Address, city, or neighborhood" />
          <button aria-label="Search homes">
            <ArrowRight size={18} />
          </button>
        </form>
        <p className="hero-foot-label">
          <span />
          Rooted in Little Rock. Built around you.
        </p>
        <a href="#our-story" className="hero-scroll">
          Discover more
          <ArrowDown size={14} />
        </a>
      </div>
    </section>
  );
}
