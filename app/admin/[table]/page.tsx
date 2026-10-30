import { notFound } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { all } from '@/lib/repository';
import { adminNames, adminReadTables, type AdminTable } from '@/lib/admin';
import type { TableName } from '@/lib/types';
import { AdminEditor } from '@/components/admin/editor';
import { AdminModulePage, platformModules } from '@/components/admin/module-page';
import { WorkspaceHeading } from '@/components/admin/shared';
export default async function Collection({ params }: { params: Promise<{ table: string }> }) {
  const user = await currentUser();
  if (!user || !['agent', 'admin'].includes(user.role)) return null;
  const { table } = await params;
  if (platformModules.includes(table)) return <AdminModulePage module={table} />;
  if (!adminReadTables.includes(table)) notFound();
  if (user.role !== 'admin')
    return (
      <section className="workspace-empty">
        <h1>Administrator access required</h1>
        <p>This shared content collection is managed by administrators.</p>
      </section>
    );
  const rows = await all(table as TableName, true);
  return (
    <>
      <WorkspaceHeading
        title={adminNames[table as AdminTable] || table.replaceAll('_', ' ')}
        description="Thoughtful details, ready for your next chapter."
      />
      <section className="workspace-panel">
        <AdminEditor table={table} rows={rows as unknown as Record<string, unknown>[]} />
      </section>
    </>
  );
}
