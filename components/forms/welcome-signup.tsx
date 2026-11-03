'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Turnstile } from './turnstile';
import { NEWSLETTER_CONSENT } from '@/lib/consent';

export function WelcomeSignup({ onSuccess }: { onSuccess: () => void }) {
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  if (success)
    return (
      <div className="welcome-success" role="status">
        <Check size={28} aria-hidden="true" />
        <h3>You’re on the list.</h3>
        <p>
          Your email signup is saved. Explore homes or visit My Search Portal to save your criteria.
        </p>
        <Link className="text-link" href="/home-search/listings">
          Explore homes ↗
        </Link>
      </div>
    );

  return (
    <form
      className="welcome-signup"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        const form = new FormData(event.currentTarget);
        setBusy(true);
        setError('');
        try {
          const response = await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              source: 'newsletter',
              email: form.get('email'),
              newsletter: form.has('newsletter'),
              email_phone: false,
              sms: false,
              website: form.get('website'),
              trigger_source: `first-visit:${window.location.pathname}`,
              utm: Object.fromEntries(
                [...new URLSearchParams(window.location.search)].filter(([key]) =>
                  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].includes(
                    key,
                  ),
                ),
              ),
              turnstile_token: token,
            }),
          });
          const result = (await response.json()) as { error?: string };
          if (!response.ok)
            throw new Error(result.error || 'We could not save your signup. Please try again.');
          setSuccess(true);
          onSuccess();
        } catch (error) {
          setError(
            error instanceof Error ? error.message : 'We could not connect. Please try again.',
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="welcome-email">
        <span className="sr-only">Email address</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Email"
          maxLength={254}
          required
        />
      </label>
      <div className="sr-only" aria-hidden="true">
        <label>
          Leave this empty
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="consent">
        <input name="newsletter" type="checkbox" required />
        <span>
          {NEWSLETTER_CONSENT} <Link href="/terms-and-conditions">Privacy Policy</Link>.
        </span>
      </label>
      <Turnstile onToken={setToken} />
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      <button className="button welcome-submit" type="submit" disabled={busy}>
        {busy ? 'Submitting…' : 'Submit'}
      </button>
    </form>
  );
}
