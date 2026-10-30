import { notFound } from 'next/navigation';
import { getListings } from '@/lib/data';
import { PropertyAccess } from '@/components/property/property-access';
export const dynamic = 'force-dynamic';
export default async function SearchDetail({
  params,
}: {
  params: Promise<{ 'id-address': string }>;
}) {
  const key = (await params)['id-address'];
  const listing = (await getListings()).find(
    (l) =>
      l.slug === key ||
      key === `${l.id}-${l.address_line.toLowerCase().replaceAll(' ', '-')}` ||
      key === `${l.mls_id.toLowerCase()}-${l.address_line.toLowerCase().replaceAll(' ', '-')}`,
  );
  if (!listing) notFound();
  return <PropertyAccess listing={listing} />;
}
