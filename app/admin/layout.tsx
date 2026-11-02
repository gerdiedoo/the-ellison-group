import Link from 'next/link';
import { currentUser } from '@/lib/auth';

import { PageHero } from '@/components/ui/primitives';
import { AuthPanel } from '@/components/portal/auth-panel';
import { AdminFrame } from '@/components/admin/frame';
import { isVercelDemoPreview } from '@/lib/preview-demo';
export const metadata = {
  title: 'Team Dashboard | The Ellison Group',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user)
    return (
      <>
        <div className="admin-signin-brand">
          <Link href="/">The Ellison Group ↗</Link>
        </div>
        <PageHero
          eyebrow="The Ellison Group"
          title="A thoughtful workspace for every next chapter."
        />
        <section className="container section-sm">
          <AuthPanel admin />
        </section>
      </>
    );
  if (!['agent', 'admin'].includes(user.role))
    return (
      <>
        <PageHero
          title="Team access required"
          description="Your search portal is ready. This area is reserved for the team."
        />
        <div className="container section-sm">
          <Link className="button" href="/home-search/account">
            My Search Portal ↗
          </Link>
        </div>
      </>
    );
  return (
    <AdminFrame user={user}>
      {isVercelDemoPreview && (
        <p className="demo-note">
          Preview demo: changes are temporary and may reset when the preview restarts.
        </p>
      )}
      {children}
    </AdminFrame>
  );
}
