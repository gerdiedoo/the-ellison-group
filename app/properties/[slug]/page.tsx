import { notFound } from 'next/navigation';
import { getListings } from '@/lib/data';
import { PropertyAccess } from '@/components/property/property-access';
import { metadata } from '@/lib/seo';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = (await getListings()).find((l) => l.slug === slug);
  return metadata(
    listing ? `${listing.address_line}, ${listing.city}` : 'Property',
    `/properties/${slug}`,
    listing?.description,
  );
}
export default async function Property({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = (await getListings()).find((l) => l.slug === slug);
  if (!listing) notFound();
  return <PropertyAccess listing={listing} />;
}
