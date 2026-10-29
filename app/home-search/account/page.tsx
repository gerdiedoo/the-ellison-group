import { currentUser } from '@/lib/auth';
import { all } from '@/lib/repository';
import { PageHero } from '@/components/ui/primitives';
import { AuthPanel } from '@/components/portal/auth-panel';
import { PortalWorkspace } from '@/components/portal/workspace';
export const metadata={title:'My Search Portal | The Ellison Group',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function Account(){const user=await currentUser();return <><PageHero eyebrow="Your possibilities, all in one place" title="My Search Portal" description="Saved searches, new-listing alerts, and the details that make a search yours."/><section className="container section-sm">{user?<PortalWorkspace profile={user} searches={(await all('saved_searches')).filter(s=>s.user_id===user.id)} history={(await all('audit_log',true)).filter(a=>a.actor_id===user.id&&a.table_name==='profiles')}/>:<AuthPanel/>}</section></>;}
