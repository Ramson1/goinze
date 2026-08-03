'use client';

import { Inbox, PenSquare, Search, Send, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { lecturerApi, type Contact, type InboxMessage } from '@/lib/api';
import { cn } from '@/lib/cn';

function senderName(m: InboxMessage): string {
  if (!m.sender) return 'Unknown sender';
  return `${m.sender.firstName} ${m.sender.lastName}`.trim();
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatWhen(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [composeOpen, setComposeOpen] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [msgs, cts] = await Promise.all([
        lecturerApi.messages(),
        lecturerApi.contacts().catch(() => [] as Contact[]),
      ]);
      setMessages(msgs);
      setContacts(cts);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q === '') return messages;
    return messages.filter(
      (m) =>
        senderName(m).toLowerCase().includes(q) ||
        (m.subject ?? '').toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q),
    );
  }, [messages, search]);

  const active = messages.find((m) => m.id === activeId) ?? null;
  const unreadCount = messages.filter((m) => !m.readAt).length;

  async function openMessage(m: InboxMessage) {
    setActiveId(m.id);
    if (!m.readAt) {
      try {
        await lecturerApi.markMessageRead(m.id);
        setMessages((prev) =>
          prev.map((x) => (x.id === m.id ? { ...x, readAt: new Date().toISOString() } : x)),
        );
      } catch {
        // Non-fatal: the message stays visually unread.
      }
    }
  }

  async function handleSend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError(null);
    try {
      await lecturerApi.sendMessage({
        recipientId: recipientId || undefined,
        subject: subject.trim() || undefined,
        body: body.trim(),
      });
      setComposeOpen(false);
      setRecipientId('');
      setSubject('');
      setBody('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Messages"
        subtitle="Communicate with students across your courses."
        actions={
          <button type="button" onClick={() => setComposeOpen(true)} className="btn-primary">
            <PenSquare className="h-4 w-4" /> New Message
          </button>
        }
      />

      {error && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* Inbox list */}
          <div className="border-b border-slate-100 md:border-b-0 md:border-r">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 p-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search messages…"
                  className="input pl-9"
                />
              </div>
              {unreadCount > 0 && (
                <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <ul className="max-h-[560px] divide-y divide-slate-100 overflow-y-auto">
              {loading ? (
                <li className="px-4 py-12 text-center text-sm text-slate-400">
                  Loading messages…
                </li>
              ) : (
                filtered.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => openMessage(m)}
                      className={cn(
                        'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
                        activeId === m.id ? 'bg-brand/5' : 'hover:bg-slate-50',
                      )}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                        {initials(senderName(m))}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              'truncate text-sm text-slate-900',
                              m.readAt ? 'font-medium' : 'font-bold',
                            )}
                          >
                            {senderName(m)}
                          </span>
                          <span className="shrink-0 text-[11px] text-slate-400">
                            {formatWhen(m.createdAt)}
                          </span>
                        </span>
                        {m.subject && (
                          <span className="mt-0.5 block truncate text-xs font-medium text-slate-700">
                            {m.subject}
                          </span>
                        )}
                        <span
                          className={cn(
                            'mt-0.5 block truncate text-xs text-slate-500',
                            !m.readAt && 'font-semibold text-slate-700',
                          )}
                        >
                          {m.body}
                        </span>
                      </span>
                      {!m.readAt && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                      )}
                    </button>
                  </li>
                ))
              )}
              {!loading && filtered.length === 0 && (
                <li className="px-4 py-12 text-center text-sm text-slate-400">
                  No messages found.
                </li>
              )}
            </ul>
          </div>

          {/* Reading pane */}
          <div className="flex flex-col md:col-span-2">
            {active ? (
              <>
                <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                    {initials(senderName(active))}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {active.subject ?? 'No subject'}
                    </p>
                    <p className="text-xs text-slate-500">
                      From {senderName(active)} ·{' '}
                      {new Date(active.createdAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto bg-slate-50/50 px-6 py-5">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                    {active.body}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
                <Inbox className="h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm text-slate-400">
                  Select a message to read it, or compose a new one.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Compose modal */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">New Message</h3>
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSend} className="space-y-4 px-6 py-5">
              <div>
                <label className="label">To</label>
                <select
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="input"
                >
                  <option value="">Select a recipient…</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.matricNo ? ` (${c.matricNo})` : ''}
                      {c.courseCode ? ` · ${c.courseCode}` : ''}
                    </option>
                  ))}
                </select>
                {contacts.length === 0 && (
                  <p className="mt-1 text-xs text-slate-400">
                    No contacts available — students appear here once they register for your
                    courses.
                  </p>
                )}
              </div>

              <div>
                <label className="label">Subject (optional)</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. CSC 101 test rescheduled"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Message</label>
                <textarea
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  placeholder="Write your message…"
                  className="input resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setComposeOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending || !recipientId}
                  className="btn-primary disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
