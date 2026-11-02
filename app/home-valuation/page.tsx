import { PageHero, DemoNote } from '@/components/ui/primitives';
import { ValuationForm } from '@/components/forms/valuation-form';
import { ContactDetails } from '@/components/shell/site-provider';
import { getListings } from '@/lib/data';
import { metadata } from '@/lib/seo';
export const generateMetadata = () =>
  metadata(
    'Home Valuation',
    '/home-valuation',
    'Get your instant home valuation or a personal market analysis from The Ellison Group.',
  );
export const dynamic = 'force-dynamic';
export default async function ValuationPage({
  searchParams,
}: {
  searchParams: Promise<{ address?: string }>;
}) {
  const { address } = await searchParams;
  const comps = (await getListings()).filter((l) => l.status === 'sold');
  return (
    <>
      <PageHero
        eyebrow="A thoughtful starting point"
        title="How Much is Your Home Worth?"
        description="Get your instant home valuation. Enter your details to see how much your home is worth."
      />
      <section className="container section-sm split-layout valuation-full-layout">
        <div>
          <ValuationForm initialAddress={address || ''} full comps={comps} />
        </div>
        <aside>
          <p className="eyebrow">From an estimate to a plan</p>
          <h2>
            Local knowledge.
            <br />A clearer picture.
          </h2>
          <div className="valuation-steps">
            {[
              ['01', 'Tell us about home.', 'Start with your address and a few details.'],
              ['02', 'See the possibilities.', 'Explore a range based on comparable sales.'],
              [
                '03',
                'Get a local perspective.',
                'A personal market analysis adds the details a number can’t.',
              ],
            ].map(([n, t, b]) => (
              <div key={n}>
                <span>{n}</span>
                <div>
                  <h3>{t}</h3>
                  <p>{b}</p>
                </div>
              </div>
            ))}
          </div>
          <ContactDetails />
          <DemoNote>
            Demo estimates are illustrative. No address is geocoded without a configured provider;
            unmatched addresses receive a manual CMA follow-up.
          </DemoNote>
        </aside>
      </section>
      <section className="valuation-education">
        <div className="container">
          <p className="eyebrow">Beyond the number</p>
          <h2>How is a Valuation Performed?</h2>
          <p className="valuation-education-intro">
            Two ways to get a more complete picture of your home.
          </p>
          <div className="valuation-education-grid">
            <article>
              <span>01 / Market analysis</span>
              <h3>Comparative Market Analysis</h3>
              <p>
                Your agent reviews similar homes recently sold nearby, then considers differences in
                size, condition, features, and location. That local perspective helps you understand
                where your home fits in today's market.
              </p>
            </article>
            <article>
              <span>02 / Professional appraisal</span>
              <h3>An independent opinion</h3>
              <p>
                A licensed appraiser inspects the property and reviews comparable sales to develop
                an independent opinion of value. The report gives a detailed assessment of your home
                and is often part of buying or refinancing.
              </p>
            </article>
          </div>
        </div>
      </section>
      <section className="container valuation-importance">
        <p className="eyebrow">Plan your next chapter</p>
        <h2>Why is a Valuation Important?</h2>
        <p className="valuation-education-intro">
          Understanding your home's value can bring clarity to decisions, big and small.
        </p>
        <div className="valuation-education-grid">
          <article>
            <span>01 / Refinancing</span>
            <h3>Know where you stand.</h3>
            <p>
              An updated valuation helps you understand your equity before discussing refinancing
              options with a lender.
            </p>
          </article>
          <article>
            <span>02 / Home improvements</span>
            <h3>Improve with perspective.</h3>
            <p>
              Knowing how your home compares with nearby properties can help you prioritize
              improvements and plan a renovation budget.
            </p>
          </article>
          <article>
            <span>03 / Borrowing against equity</span>
            <h3>Understand your options.</h3>
            <p>
              Your property's value helps a lender assess available equity when you explore a home
              equity loan or line of credit.
            </p>
          </article>
          <article>
            <span>04 / Planning ahead</span>
            <h3>Make your next move clearer.</h3>
            <p>
              Whether you're preparing to sell or simply looking ahead, a current valuation gives
              you a useful starting point for your plans.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
