import { currentUser } from '@/lib/auth';
import { isStaff } from '@/lib/platform/permissions';
import { platformSnapshot } from '@/lib/platform/snapshot';
import { Crm } from '@/components/admin/crm';
export default async function Page() {
  const user = await currentUser();
  if (!isStaff(user)) return null;
  return <Crm data={await platformSnapshot(user)} />;
}
