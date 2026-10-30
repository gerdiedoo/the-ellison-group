import type { Profile, Lead, Listing } from '@/lib/types';
import type { Conversation, Task } from './types';
export const isStaff = (user: Profile | null): user is Profile =>
  Boolean(user && ['admin', 'agent'].includes(user.role));
export const canManageLead = (user: Profile, lead: Pick<Lead, 'assigned_to'>) =>
  user.role === 'admin' || (user.role === 'agent' && lead.assigned_to === user.id);
export const canManageListing = (user: Profile, listing: Pick<Listing, 'listing_agent_id'>) =>
  user.role === 'admin' ||
  (user.role === 'agent' && Boolean(user.agent_id) && listing.listing_agent_id === user.agent_id);
export const canManageConversation = (user: Profile, c: Pick<Conversation, 'assigned_to'>) =>
  user.role === 'admin' || (user.role === 'agent' && c.assigned_to === user.id);
export const canManageTask = (user: Profile, t: Pick<Task, 'assigned_to'>) =>
  user.role === 'admin' || (user.role === 'agent' && t.assigned_to === user.id);
