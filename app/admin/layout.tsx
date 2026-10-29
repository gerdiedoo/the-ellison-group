import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { adminNames } from '@/lib/admin';
import { PageHero } from '@/components/ui/primitives';
import { AuthPanel } from '@/components/portal/auth-panel';
export const metadata={title:'Team Dashboard | The Ellison Group',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function AdminLayout({children}:{children:React.ReactNode}){const user=await currentUser();if(!user)return <><PageHero eyebrow="The Ellison Group" title="Team dashboard"/><section className="container section-sm"><AuthPanel admin/></section></>;if(!['agent','admin'].includes(user.role))return <PageHero title="Team access required" description="Your search portal is ready. This area is reserved for the team."/>;return <><PageHero eyebrow="A little behind the scenes" title="Team dashboard" description={`Welcome, ${user.full_name||user.email}.`}/><div className="container admin-layout"><aside className="admin-nav"><Link href="/admin">Overview</Link>{Object.entries(adminNames).map(([key,name])=><Link key={key} href={`/admin/${key}`}>{name}</Link>)}<Link href="/admin/dev_outbox">Development outbox</Link><Link href="/admin/audit_log">Audit log</Link><Link href="/home-search/account">My profile</Link></aside><section className="admin-content">{children}</section></div></>;}
