'use client';

import { useState } from 'react';
import { Turnstile } from '@/components/forms/turnstile';

export function GoogleSignIn({ enabled }: { enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  async function signIn() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'google',
          turnstile_token: token,
          return_to: window.location.pathname + window.location.search,
        }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url)
        throw new Error(data.error || 'Google sign-in could not be started. Please try again.');
      window.location.assign(data.url);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Please try again.');
      setBusy(false);
    }
  }

  return (
    <div className="google-sign-in">
      {enabled && <Turnstile onToken={setToken} />}
      <button
        type="button"
        className="google-sign-in-button"
        disabled={!enabled || busy || !token}
        onClick={() => void signIn()}
      >
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5h6.6c3.9-3.6 6.1-8.8 6.1-14.9Z"
          />
          <path
            fill="#34A853"
            d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5c-1.8 1.2-4.1 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.2A20.4 20.4 0 0 0 24 44Z"
          />
          <path
            fill="#FBBC05"
            d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.2H5.8a20 20 0 0 0 0 17.6l6.8-5.2Z"
          />
          <path
            fill="#EA4335"
            d="M24 12c3 0 5.6 1 7.7 3l5.8-5.8A19.3 19.3 0 0 0 24 4 20.4 20.4 0 0 0 5.8 15.2l6.8 5.2C14.2 15.6 18.7 12 24 12Z"
          />
        </svg>
        {busy ? 'Connecting to Google…' : 'Continue with Google'}
      </button>
      {!enabled && <p className="sign-in-note">Google sign-in is not connected yet.</p>}
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
