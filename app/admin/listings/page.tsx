import { currentUser } from '@/lib/auth';
import { isStaff } from '@/lib/platform/permissions';
import { platformSnapshot } from '@/lib/platform/snapshot';
import { PropertyInventory } from '@/components/admin/property-inventory';
export default async function Page() {
  const user = await currentUser();
  if (!isStaff(user)) return null;
  return <PropertyInventory data={await platformSnapshot(user)} />;
}
