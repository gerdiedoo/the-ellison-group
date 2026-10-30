import { notFound } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { isStaff } from '@/lib/platform/permissions';
import { platformSnapshot } from '@/lib/platform/snapshot';
import { LeadDetail } from '@/components/admin/lead-detail';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!isStaff(user)) return null;
  const { id } = await params,
    data = await platformSnapshot(user),
    lead = data.leads.find((l) => l.id === id);
  if (!lead) notFound();
  return <LeadDetail data={data} lead={lead} />;
}
