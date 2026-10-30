'use client';
import Link from 'next/link';
import type { Notification } from '@/lib/platform/types';
import { useCommand, Feedback } from './shared';
export function Notifications({ rows }: { rows: Notification[] }) {
  const command = useCommand(),
    unread = rows
      .filter((n) => !n.read_at)
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 6);
  if (!unread.length) return null;
  return (
    <section className="workspace-panel">
      <div className="workspace-panel-heading">
        <div>
          <p className="eyebrow">A little attention, at the right time</p>
          <h2>Your next thoughtful steps</h2>
        </div>
        <span className="status-pill waiting">{rows.filter((n) => !n.read_at).length} unread</span>
      </div>
      {unread.map((n) => (
        <div className="workspace-record-link" key={n.id}>
          <div>
            <strong>{n.title}</strong>
            <p className="muted">{n.body}</p>
            <Link
              className="text-link"
              href={n.lead_id ? `/admin/leads/${n.lead_id}` : '/admin/conversations'}
            >
              {n.lead_id ? 'Open contact' : 'Open inbox'} ↗
            </Link>
          </div>
          <button
            className="text-link"
            disabled={command.busy}
            onClick={() => command.run('notification_read', undefined, n.id)}
          >
            Mark read
          </button>
        </div>
      ))}
      <Feedback {...command} />
    </section>
  );
}
