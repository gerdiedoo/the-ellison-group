'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Turnstile } from './turnstile';
import { WorkspaceDialog } from '@/components/admin/shared';
import type { GateAction } from '@/lib/platform/capture';
const ContactForm = dynamic(() => import('./contact-form').then((m) => m.ContactForm), {
  loading: () => <p role="status">Loading contact form…</p>,
});
export type GateConfig = {
  required_fields: ('full_name' | 'email' | 'phone')[];
  allow_basic_browsing: boolean;
  google_enabled: boolean;
};
type BasicListing = { id: string; slug: string; address_line: string; city: string };
export function GateForm({
  listing,
  config,
  action = 'detail',
  profile,
  onComplete,
}: {
  listing: BasicListing;
  config: GateConfig;
  action?: GateAction;
  profile?: { full_name: string; email: string; phone: string };
  onComplete?: () => void;
}) {
  const [error, setError] = useState(''),
    [token, setToken] = useState(''),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <div className="property-gate-form">
      <p className="eyebrow">A personal connection makes the difference</p>
      <h2>Let's take the next step.</h2>
      <p className="muted">
        {config.allow_basic_browsing
          ? `Tell us a little about yourself to continue with ${listing.address_line}.`
          : 'Share your details to continue your property search.'}
      </p>
      {config.google_enabled && !profile && (
        <>
          <Turnstile onToken={setToken} />
          <button
            className="button button-outline mt-8"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                const r = await fetch('/api/auth', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'google',
                    turnstile_token: token,
                    return_to: `/properties/${listing.slug}`,
                  }),
                });
                const data = (await r.json()) as { url?: string; error?: string };
                if (!r.ok || !data.url)
                  throw new Error(data.error || 'Google sign-in could not be started.');
                window.location.href = data.url;
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Please try again.');
                setBusy(false);
              }
            }}
          >
            Continue with Google ↗
          </button>
          <p className="gate-or">or continue with your contact details</p>
        </>
      )}
      <p className="error-text" role="alert">
        {error}
      </p>
      <ContactForm
        source="agent"
        requiredFields={config.required_fields}
        extra={{
          listing_id: listing.id,
          gate_action: action,
          trigger_source: `/properties/${listing.slug}`,
          first_name: profile?.full_name.split(' ')[0] || '',
          last_name: profile?.full_name.split(' ').slice(1).join(' ') || '',
          email: profile?.email || '',
          phone: profile?.phone || '',
        }}
        buttonLabel="Continue to the property"
        onSuccess={() => {
          onComplete?.();
          router.refresh();
        }}
      />
    </div>
  );
}
export function CaptureGateHost() {
  const [gate, setGate] = useState<{
    listing: BasicListing;
    config: GateConfig;
    action: GateAction;
  } | null>(null);
  useEffect(() => {
    const listen = async (event: Event) => {
      const detail = (event as CustomEvent<{ listing_id: string; action: GateAction }>).detail;
      try {
        const r = await fetch(
          `/api/capture/check?listing_id=${encodeURIComponent(detail.listing_id)}&action=${detail.action}`,
        );
        if (!r.ok) return;
        const data = (await r.json()) as {
          required: boolean;
          listing: BasicListing;
          config: GateConfig;
        };
        if (data.required) setGate({ ...data, action: detail.action });
      } catch {
        /* The initiating control keeps its existing error feedback. */
      }
    };
    window.addEventListener('ellison-capture', listen);
    return () => window.removeEventListener('ellison-capture', listen);
  }, []);
  return (
    <WorkspaceDialog
      open={gate !== null}
      onClose={() => setGate(null)}
      title="A little closer to home"
      description="Your details help our team make your next step personal."
    >
      {gate && (
        <GateForm
          listing={gate.listing}
          config={gate.config}
          action={gate.action}
          onComplete={() => {
            window.dispatchEvent(
              new CustomEvent('ellison-capture-complete', {
                detail: { listing_id: gate.listing.id, action: gate.action },
              }),
            );
            setGate(null);
          }}
        />
      )}
    </WorkspaceDialog>
  );
}
