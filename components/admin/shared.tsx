'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ArrowUpRight } from 'lucide-react';
export function WorkspaceHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="workspace-heading">
      <div>
        <p className="eyebrow">{eyebrow || 'The Ellison Group'}</p>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="inline-actions">{children}</div>}
    </div>
  );
}
export function WorkspaceDialog({
  open,
  onClose,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className={`drawer workspace-drawer ${wide ? 'wide' : ''}`}>
          <Dialog.Close className="icon-button drawer-close" aria-label="Close editor">
            <X />
          </Dialog.Close>
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description className="muted">
            {description || 'Thoughtful details make the next step clearer.'}
          </Dialog.Description>
          <div className="mt-8">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function useCommand() {
  const router = useRouter(),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(''),
    [error, setError] = useState(false);
  async function run(
    action: string,
    values?: unknown,
    id?: string,
    ids?: string[],
    request_id?: string,
  ) {
    setBusy(true);
    setStatus('');
    setError(false);
    try {
      const r = await fetch('/api/admin/platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, values, id, ids, request_id }),
      });
      const data = (await r.json()) as { error?: string; id?: string; message?: string };
      if (!r.ok) throw new Error(data.error || 'Unable to save.');
      setStatus(data.message || 'Saved. Your workspace is up to date.');
      router.refresh();
      return { ok: true, ...data };
    } catch (e) {
      setError(true);
      setStatus(e instanceof Error ? e.message : 'We could not connect. Please try again.');
      return { ok: false };
    } finally {
      setBusy(false);
    }
  }
  return { run, busy, status, error, setStatus };
}
export function Feedback({ status, error = false }: { status: string; error?: boolean }) {
  return (
    <p role={error ? 'alert' : 'status'} className={`workspace-feedback ${error ? 'error' : ''}`}>
      {status}
    </p>
  );
}
export function SubmitButton({ busy, label = 'Save changes' }: { busy: boolean; label?: string }) {
  return (
    <button className="button" disabled={busy}>
      <span>{busy ? 'Saving…' : label}</span>
      <ArrowUpRight size={15} />
    </button>
  );
}
export function MiniMetric({
  label,
  value,
  note,
}: {
  label: string;
  value: React.ReactNode;
  note?: string;
}) {
  return (
    <article className="workspace-metric">
      <p>{label}</p>
      <strong>{value}</strong>
      {note && <span>{note}</span>}
    </article>
  );
}
