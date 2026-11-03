'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { GoogleSignIn } from '@/components/portal/google-sign-in';
import { WelcomeSignup } from '@/components/forms/welcome-signup';

const WELCOME_KEY = 'ellison-welcome-v1';
const REMINDER_KEY = 'ellison-sign-in-dismissed-v1';
type VisitorSession = { authenticated: boolean; google_enabled: boolean };

// Storage can be disabled by browser privacy settings. Prompts still remain dismissible.
function readStorage(key: string, session = false) {
  try {
    return (session ? sessionStorage : localStorage).getItem(key);
  } catch {
    return null;
  }
}
function remember(key: string, session = false) {
  try {
    (session ? sessionStorage : localStorage).setItem(key, 'true');
  } catch {
    /* In-memory state still works. */
  }
}

export function VisitorPrompts() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const pathname = usePathname();
  const excluded =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/home-search/account') ||
    pathname.startsWith('/dev') ||
    pathname.startsWith('/terms-and-conditions');
  const [session, setSession] = useState<VisitorSession | null>(null);
  const [welcome, setWelcome] = useState(false);
  const [welcomeHandled, setWelcomeHandled] = useState(false);
  const [reminder, setReminder] = useState(false);
  const [reminderDismissed, setReminderDismissed] = useState(false);

  useEffect(() => {
    setWelcome(false);
    setReminder(false);
    if (excluded) return;
    const controller = new AbortController();
    setSession(null);
    void fetch('/api/visitor-session', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        if (response.ok) setSession((await response.json()) as VisitorSession);
      })
      .catch(() => {
        /* Browsing remains available if session lookup fails. */
      });
    return () => controller.abort();
  }, [excluded, pathname]);

  useEffect(() => {
    if (excluded || !session || session.authenticated) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      // Do not interrupt an existing contact form, property gate, or menu.
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) {
        timer = setTimeout(schedule, 1500);
        return;
      }
      if (!welcomeHandled && !readStorage(WELCOME_KEY)) {
        setWelcome(true);
        remember(WELCOME_KEY);
        return;
      }
      if (!reminderDismissed && !readStorage(REMINDER_KEY, true)) setReminder(true);
    };
    timer = setTimeout(schedule, welcomeHandled || readStorage(WELCOME_KEY) ? 8000 : 1500);
    return () => clearTimeout(timer);
  }, [excluded, session, welcomeHandled, reminderDismissed]);

  function closeWelcome() {
    remember(WELCOME_KEY);
    setWelcome(false);
    setWelcomeHandled(true);
  }

  if (excluded || !session || session.authenticated) return null;
  return (
    <>
      <Dialog.Root
        open={welcome}
        onOpenChange={(open) => {
          if (!open) closeWelcome();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay welcome-overlay" />
          <Dialog.Content
            className="welcome-dialog"
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              titleRef.current?.focus();
            }}
          >
            <div className="welcome-photo">
              <Image
                src="/seed/kitchen.jpg"
                alt="A bright kitchen with a marble island and warm wood seating"
                fill
                sizes="(max-width: 700px) 92vw, 47vw"
              />
            </div>
            <div className="welcome-copy">
              <Dialog.Close className="icon-button welcome-close" aria-label="Close welcome popup">
                <X size={23} />
              </Dialog.Close>
              <Dialog.Title ref={titleRef} tabIndex={-1}>
                Tailored Listings for You
              </Dialog.Title>
              <Dialog.Description>
                A little local guidance, delivered. Sign up for listing highlights and market
                updates to help you find a place that feels like home.
              </Dialog.Description>
              <WelcomeSignup onSuccess={() => remember(WELCOME_KEY)} />
              <p className="welcome-portal-link">
                Want to save your favorites?{' '}
                <Link href="/home-search/account">Visit My Search Portal ↗</Link>
              </p>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {reminder && !welcome && !reminderDismissed && (
        <aside className="sign-in-reminder" aria-labelledby="sign-in-reminder-title">
          <button
            className="icon-button sign-in-reminder-close"
            aria-label="Dismiss sign-in reminder"
            onClick={() => {
              remember(REMINDER_KEY, true);
              setReminderDismissed(true);
              setReminder(false);
            }}
          >
            <X size={18} />
          </button>
          <p className="eyebrow">Your next chapter, saved</p>
          <h2 id="sign-in-reminder-title">Pick up where you left off.</h2>
          <p>
            Sign in to keep your favorite homes and saved searches together, wherever you browse.
          </p>
          <GoogleSignIn enabled={session.google_enabled} />
          <Link className="sign-in-portal-link" href="/home-search/account">
            Visit My Search Portal ↗
          </Link>
        </aside>
      )}
    </>
  );
}
