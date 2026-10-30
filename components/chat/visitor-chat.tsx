'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, ArrowUpRight, Send, UserRound } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Turnstile } from '@/components/forms/turnstile';
import { money } from '@/lib/utils';
const ContactForm = dynamic(
  () => import('@/components/forms/contact-form').then((m) => m.ContactForm),
  { loading: () => <p role="status">Loading contact form…</p> },
);
type ChatData = {
  enabled: boolean;
  configured: boolean;
  conversation: {
    id: string;
    mode: 'ai' | 'human';
    status: 'open' | 'waiting' | 'resolved';
    ai_status: string;
  } | null;
  messages: {
    id: string;
    role: string;
    body: string;
    created_at: string;
    properties: {
      id: string;
      slug: string;
      address_line: string;
      price: number;
      kind: string;
      status: string;
      beds: number;
    }[];
  }[];
};
export function VisitorChat() {
  const pathname = usePathname(),
    [open, setOpen] = useState(false),
    [data, setData] = useState<ChatData | null>(null),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [token, setToken] = useState(''),
    [contact, setContact] = useState(false),
    [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const admin = pathname.startsWith('/admin');
  useEffect(() => {
    if (admin) return;
    let active = true;
    fetch('/api/chat')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ChatData | null) => {
        if (active && d) setData(d);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [admin]);
  useEffect(() => {
    if (!open || !data?.conversation?.id) return;
    const id = data.conversation.id,
      timer = setInterval(() => {
        fetch(`/api/chat?conversation_id=${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d: ChatData | null) => {
            if (d) setData(d);
          })
          .catch(() => {});
      }, 10000);
    return () => clearInterval(timer);
  }, [open, data?.conversation?.id]);
  if (admin || !data?.enabled) return null;
  async function send(action: 'message' | 'handoff') {
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          conversation_id: data?.conversation?.id,
          request_id: requestId,
          message: action === 'message' ? message : undefined,
          listing_id:
            document.querySelector('[data-listing-id]')?.getAttribute('data-listing-id') ||
            undefined,
          turnstile_token: token,
        }),
      });
      const result = (await r.json()) as ChatData & { error?: string };
      if (Array.isArray(result.messages)) {
        setData(result);
        setMessage('');
        setRequestId(crypto.randomUUID());
      }
      if (!r.ok) throw new Error(result.error || 'We could not connect. Please try again.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'We could not connect. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="visitor-chat">
      {open ? (
        <section className="visitor-chat-panel" aria-label="The Ellison Group conversation">
          <header>
            <div>
              <p className="eyebrow">The Ellison Group</p>
              <h2>
                {data.conversation?.mode === 'human'
                  ? 'A personal connection'
                  : data.configured
                    ? 'Your local search assistant'
                    : 'Message our team'}
              </h2>
              <p>
                {data.conversation?.mode === 'human'
                  ? 'Human follow-up requested · replies appear here'
                  : data.configured
                    ? 'AI assistant · your preferences, real property records'
                    : 'AI unavailable · questions are saved for our team'}
              </p>
            </div>
            <button className="icon-button" aria-label="Close chat" onClick={() => setOpen(false)}>
              <X size={19} />
            </button>
          </header>
          <div className="visitor-chat-scroll">
            {contact && data.conversation ? (
              <div className="chat-contact">
                <button className="text-link" onClick={() => setContact(false)}>
                  ← Back to the conversation
                </button>
                <h3 className="mt-8">Make it personal.</h3>
                <p className="muted">Share your details so the team can follow up with context.</p>
                <ContactForm
                  source="contact"
                  extra={{
                    conversation_id: data.conversation.id,
                    listing_id:
                      document
                        .querySelector('[data-listing-id]')
                        ?.getAttribute('data-listing-id') || null,
                    trigger_source: pathname,
                    message: 'Contact details shared from the website conversation.',
                  }}
                  buttonLabel="Share my details"
                  onSuccess={() => {
                    setContact(false);
                    setError('Your details have been saved for the team.');
                  }}
                />
              </div>
            ) : (
              <>
                <div className="chat-welcome">
                  <span className="chat-brand-mark">E</span>
                  <h3>Every next chapter starts with a conversation.</h3>
                  <p>
                    {data.configured
                      ? 'Tell us what home looks like to you: a place, a budget, a little room to grow.'
                      : 'Ask a question or tell us about your search. Your message will be saved for a personal reply.'}
                  </p>
                </div>
                <div role="log" aria-label="Visitor conversation" aria-live="polite">
                  {data.messages.map((m) => (
                    <article className={`visitor-message ${m.role}`} key={m.id}>
                      <p className="message-label">
                        {m.role === 'visitor'
                          ? 'You'
                          : m.role === 'assistant'
                            ? 'AI assistant'
                            : 'The Ellison Group · human agent'}
                      </p>
                      <p>{m.body}</p>
                      {m.properties.map((l) => (
                        <Link key={l.id} href={`/properties/${l.slug}`} className="chat-property">
                          <span>
                            {l.address_line}
                            <small>
                              {money(l.price)}
                              {l.kind === 'rent' ? ' / month' : ''} · {l.beds} beds
                            </small>
                          </span>
                          <ArrowUpRight size={16} />
                        </Link>
                      ))}
                    </article>
                  ))}
                </div>
                {busy && (
                  <p className="chat-waiting" role="status">
                    {data.configured && data.conversation?.mode !== 'human'
                      ? 'Reviewing your question…'
                      : 'Saving your message…'}
                  </p>
                )}
              </>
            )}
          </div>
          <footer>
            {!contact && (
              <>
                <p role="status" className="error-text">
                  {error}
                </p>
                {data.conversation?.status === 'resolved' ? (
                  <p className="chat-closed">
                    This conversation has been resolved.{' '}
                    <Link href="/contact-us">Contact our team</Link> for your next request.
                  </p>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void send('message');
                    }}
                  >
                    <label className="sr-only" htmlFor="visitor-chat-message">
                      Your message
                    </label>
                    <div className="chat-composer">
                      <textarea
                        id="visitor-chat-message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        maxLength={3000}
                        rows={2}
                        placeholder="Tell us what you're looking for…"
                        required
                      />
                      <button aria-label="Send message" disabled={busy || !message.trim()}>
                        <Send size={18} />
                      </button>
                    </div>
                    <Turnstile onToken={setToken} />
                  </form>
                )}
                <div className="chat-actions">
                  <button
                    className="text-link"
                    disabled={busy || data.conversation?.status === 'resolved'}
                    onClick={() => send('handoff')}
                  >
                    <UserRound size={13} />
                    Request a person
                  </button>
                  {data.conversation && (
                    <button className="text-link" onClick={() => setContact(true)}>
                      Share contact details ↗
                    </button>
                  )}
                </div>
                <p className="chat-disclosure">
                  Replies may take time. AI can make mistakes; confirm property details with an
                  agent. <Link href="/terms-and-conditions">Privacy</Link>
                </p>
              </>
            )}
          </footer>
        </section>
      ) : (
        <button
          className="visitor-chat-launch"
          onClick={() => setOpen(true)}
          aria-label="Let's talk — open conversation with The Ellison Group"
        >
          <MessageCircle size={20} strokeWidth={1.5} />
          <span>Let's talk</span>
          <ArrowUpRight size={15} />
        </button>
      )}
    </div>
  );
}
