import { notFound } from 'next/navigation';
import Image from 'next/image';
import { all } from '@/lib/repository';
import { getListings } from '@/lib/data';
import { ContactForm } from '@/components/forms/contact-form';
import { ListingCard } from '@/components/search/listing-card';
import { metadata } from '@/lib/seo';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params,
    c = (await all('campaigns')).find((c) => c.slug === slug && c.status === 'active');
  return metadata(c?.name || 'A personal connection', `/campaign/${slug}`, c?.description);
}
export default async function CampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params,
    campaign = (await all('campaigns', true)).find((c) => c.slug === slug && c.status === 'active');
  if (!campaign) notFound();
  const listing = (await getListings()).find((l) => l.id === campaign.listing_id);
  return (
    <>
      <section className="editorial-hero">
        <Image
          src={listing?.listing_photos[0]?.url || '/seed/hero.jpg'}
          alt={
            listing
              ? `${listing.address_line} property photograph`
              : 'Little Rock residential property'
          }
          fill
          priority
          sizes="100vw"
        />
        <div className="hero-overlay" />
        <div className="container editorial-hero-copy">
          <p className="eyebrow">The Ellison Group · Little Rock, Arkansas</p>
          <h1>{campaign.name}</h1>
        </div>
      </section>
      <section className="section container split-layout">
        <div>
          <p className="eyebrow">A local perspective. A personal approach.</p>
          <h2>Let's make the next chapter yours.</h2>
          <p className="intro-copy mt-8">{campaign.description}</p>
          {listing && (
            <div className="mt-8">
              <ListingCard listing={listing} />
            </div>
          )}
        </div>
        <div>
          <h2>Start a conversation.</h2>
          <p className="muted mt-8">
            Tell us a little about your plans. Our team will follow up with care.
          </p>
          <div className="mt-8">
            <ContactForm
              source="contact"
              extra={{
                listing_id: listing?.id || null,
                trigger_source: `/campaign/${campaign.slug}`,
                utm: {
                  utm_source: campaign.utm_source,
                  utm_medium: campaign.utm_medium,
                  utm_campaign: campaign.utm_campaign,
                },
              }}
              buttonLabel="Connect with the team"
            />
          </div>
        </div>
      </section>
    </>
  );
}
