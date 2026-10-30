'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  LayoutDashboard,
  House,
  Users,
  MessagesSquare,
  CalendarDays,
  CheckCheck,
  ChartNoAxesCombined,
  Megaphone,
  Workflow,
  Settings,
  ArrowUpRight,
  Menu,
  X,
  LogOut,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';
import { Wordmark } from '@/components/shell/header';
import { initials } from '@/lib/utils';
import { isMock } from '@/lib/env';
import type { Profile } from '@/lib/types';
const groups = [
  {
    name: 'Your workspace',
    items: [
      ['Overview', '/admin', LayoutDashboard],
      ['Properties', '/admin/listings', House],
      ['Leads & CRM', '/admin/leads', Users],
      ['Conversations', '/admin/conversations', MessagesSquare],
      ['Appointments', '/admin/appointments', CalendarDays],
      ['Tasks & follow-ups', '/admin/tasks', CheckCheck],
      ['Communication center', '/admin/communications', BookOpen],
    ],
  },
  {
    name: 'Grow & connect',
    admin: true,
    items: [
      ['Marketing', '/admin/marketing', Megaphone],
      ['Analytics & reports', '/admin/analytics', ChartNoAxesCombined],
      ['Automations', '/admin/automations', Workflow],
    ],
  },
  {
    name: 'Website & content',
    admin: true,
    items: [
      ['Agents', '/admin/agents', Users],
      ['Testimonials', '/admin/testimonials', BookOpen],
      ['Blog', '/admin/blog_posts', BookOpen],
      ['Neighborhoods', '/admin/neighborhoods', House],
      ['Social posts', '/admin/social_posts', Megaphone],
    ],
  },
  {
    name: 'Manage',
    admin: true,
    items: [
      ['Team & permissions', '/admin/team', ShieldCheck],
      ['Settings', '/admin/settings', Settings],
      ['Site settings', '/admin/site_settings', Settings],
      ['Redirects', '/admin/redirects', ArrowUpRight],
      ['Audit log', '/admin/audit_log', ShieldCheck],
    ],
  },
] as const;
export function AdminFrame({ user, children }: { user: Profile; children: React.ReactNode }) {
  const path = usePathname(),
    router = useRouter(),
    [menu, setMenu] = useState(false);
  const current =
    groups
      .flatMap((g) => [...g.items])
      .filter(([, href]) => path === href || (href !== '/admin' && path.startsWith(`${href}/`)))
      .at(-1)?.[0] || 'Workspace';
  const nav = (
    <>
      <Link href="/admin" className="workspace-brand" aria-label="The Ellison Group team workspace">
        <Wordmark />
        <span>THE TEAM WORKSPACE</span>
      </Link>
      <nav aria-label="Admin navigation">
        {groups
          .filter((g) => !('admin' in g) || user.role === 'admin')
          .map((g) => (
            <div key={g.name} className="workspace-nav-group">
              <p>{g.name}</p>
              {g.items.map(([label, href, Icon]) => (
                <Link
                  key={href}
                  href={href}
                  className={
                    (
                      href === '/admin'
                        ? path === href
                        : path === href || path.startsWith(`${href}/`)
                    )
                      ? 'active'
                      : ''
                  }
                  aria-current={path === href ? 'page' : undefined}
                  onClick={() => setMenu(false)}
                >
                  <Icon size={17} strokeWidth={1.5} />
                  <span>{label}</span>
                  {path === href && <i />}
                </Link>
              ))}
            </div>
          ))}
      </nav>
      <div className="workspace-sidebar-bottom">
        <span className="initials-avatar">{initials(user.full_name || user.email)}</span>
        <div>
          <strong>{user.full_name || user.email}</strong>
          <small>{user.role === 'admin' ? 'Administrator' : 'Assigned agent'}</small>
        </div>
        <button
          aria-label="Sign out"
          onClick={async () => {
            await fetch('/api/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'logout' }),
            });
            router.refresh();
          }}
        >
          <LogOut size={17} />
        </button>
      </div>
    </>
  );
  return (
    <div className="workspace">
      <aside className="workspace-sidebar">{nav}</aside>
      <div className="workspace-body">
        <header className="workspace-topbar">
          <div className="inline-actions">
            <Dialog.Root open={menu} onOpenChange={setMenu}>
              <Dialog.Trigger
                className="icon-button workspace-menu-trigger"
                aria-label="Open workspace navigation"
              >
                <Menu size={19} />
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="dialog-overlay" />
                <Dialog.Content className="workspace-mobile-nav">
                  <Dialog.Title className="sr-only">Team workspace navigation</Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Manage properties, leads, and your team.
                  </Dialog.Description>
                  <Dialog.Close className="icon-button modal-close" aria-label="Close navigation">
                    <X />
                  </Dialog.Close>
                  {nav}
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <p>
              <Link href="/admin">Workspace</Link>
              <span>/</span>
              <strong>{current}</strong>
            </p>
          </div>
          <div className="inline-actions">
            <span className="workspace-environment">
              <i />
              {isMock ? 'Demo workspace' : 'Connected to Supabase'}
            </span>
            <Link href="/" target="_blank" className="workspace-site-link">
              View website
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </header>
        <div className="workspace-page">{children}</div>
        <footer className="workspace-footer">
          <span>THE ELLISON GROUP</span>
          <span>Local knowledge. Thoughtful connections.</span>
        </footer>
      </div>
    </div>
  );
}
