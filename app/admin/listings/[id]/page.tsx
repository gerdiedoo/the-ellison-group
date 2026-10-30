import { notFound } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { isStaff } from '@/lib/platform/permissions';
import { platformSnapshot } from '@/lib/platform/snapshot';
import { PropertyEditor } from '@/components/admin/property-editor';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!isStaff(user)) return null;
  const { id } = await params,
    data = await platformSnapshot(user),
    listing = data.listings.find((l) => l.id === id);
  if (id !== 'new' && !listing) notFound();
  return <PropertyEditor key={listing?.id || 'new'} data={data} listing={listing || null} />;
}
