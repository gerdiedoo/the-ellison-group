import { currentUser } from '@/lib/auth';
import { platformSnapshot } from '@/lib/platform/snapshot';
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard';
export default async function Dashboard() {
  const user = await currentUser();
  if (!user || !['agent', 'admin'].includes(user.role)) return null;
  return <AnalyticsDashboard data={await platformSnapshot(user)} overview />;
}
