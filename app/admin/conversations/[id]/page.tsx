import { notFound } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { isStaff } from '@/lib/platform/permissions';
import { platformSnapshot } from '@/lib/platform/snapshot';
import { ConversationDetail } from '@/components/admin/conversations';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!isStaff(user)) return null;
  const { id } = await params,
    data = await platformSnapshot(user),
    conversation = data.conversations.find((c) => c.id === id);
  if (!conversation) notFound();
  return <ConversationDetail data={data} conversation={conversation} />;
}
