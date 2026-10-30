import { notFound } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { isStaff } from '@/lib/platform/permissions';
import { platformSnapshot } from '@/lib/platform/snapshot';
import { Schedule } from './schedule';
import { Conversations } from './conversations';
import { CommunicationCenter } from './communication-center';
import { Workflows } from './workflows';
import { Marketing } from './marketing';
import { TeamSettings, PlatformSettings } from './team-settings';
import { AnalyticsDashboard } from './analytics-dashboard';
export const platformModules = [
  'appointments',
  'tasks',
  'conversations',
  'communications',
  'automations',
  'marketing',
  'team',
  'settings',
  'analytics',
];
export async function AdminModulePage({ module }: { module: string }) {
  const user = await currentUser();
  if (!isStaff(user)) return null;
  if (!platformModules.includes(module)) notFound();
  if (
    user.role !== 'admin' &&
    ['automations', 'marketing', 'team', 'settings', 'analytics'].includes(module)
  )
    return (
      <section className="workspace-empty">
        <h1>Administrator access required</h1>
        <p>
          Your assigned properties, contacts, and conversations remain available in your workspace.
        </p>
      </section>
    );
  const data = await platformSnapshot(user);
  if (module === 'appointments' || module === 'tasks')
    return <Schedule data={data} kind={module} />;
  if (module === 'conversations') return <Conversations data={data} />;
  if (module === 'communications') return <CommunicationCenter data={data} />;
  if (module === 'automations') return <Workflows data={data} />;
  if (module === 'marketing') return <Marketing data={data} />;
  if (module === 'team') return <TeamSettings data={data} />;
  if (module === 'settings') return <PlatformSettings data={data} />;
  return <AnalyticsDashboard data={data} />;
}
