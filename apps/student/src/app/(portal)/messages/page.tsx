'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Mail, MailOpen, Reply, Inbox, Loader2, Send, AlertCircle } from 'lucide-react';
import Card from '@/components/Card';
import PageHeader from '@/components/PageHeader';
import { commApi, type MessageRecord } from '@/lib/api';
import { cn } from '@/lib/utils';

function senderName(m: MessageRecord) {
  return m.sender ? `${m.sender.firstName} ${m.sender.lastName}` : 'Unknown sender';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  // Reply state
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySent, setReplySent] = useState(false);

  useEffect(() => {
    commApi
      .messages()
      .then((list) => {
        setMessages(list);
        setOpenId(list[0]?.id ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load messages.'))
      .finally(() => setLoading(false));
  }, []);

  // Mark the opened message as read (optimistic + persist).
  useEffect(() => {
    if (!openId) return;
    const target = messages.find((m) => m.id === openId);
    if (!target || target.readAt) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === openId ? { ...m, readAt: new Date().toISOString() } : m,
      ),
    );
    commApi.markMessageRead(openId).catch(() => undefined);
  }, [openId, messages]);

  const open = messages.find((m) => m.id === openId) ?? null;

  function startReply() {
    setReplying(true);
    setReplySent(false);
    setReplyError(null);
    setReplyBody('');
  }

  async function handleReply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!open || !replyBody.trim()) return;
    setSending(true);
    setReplyError(null);
    try {
      await commApi.sendMessage({
        recipientId: open.senderId,
        subject: open.subject ? `Re: ${open.subject.replace(/^Re:\s*/i, '')}` : undefined,
        body: replyBody.trim(),
      });
      setReplySent(true);
      setReplyBody('');
      setReplying(false);
    } catch (err) {
      setReplyError(err instanceof Error ? err.message : 'Failed to send reply.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Messages" description="Messages from your lecturers, advisers and university offices." />

      {loading && (
        <Card className="flex items-center justify-center gap-2 p-10 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your inbox…
        </Card>
      )}

      {!loading && error && (
        <Card className="p-10 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
        </Card>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
          {/* Inbox list */}
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <Inbox className="h-4 w-4 text-brand" /> Inbox
              </h2>
            </div>
            {messages.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-slate-400">No messages yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {messages.map((m) => {
                  const isRead = Boolean(m.readAt);
                  const isActive = m.id === openId;
                  return (
                    <li key={m.id}>
                      <button
                        onClick={() => setOpenId(m.id)}
                        className={cn(
                          'flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-slate-50',
                          isActive && 'bg-blue-50/60',
                        )}
                      >
                        {isRead ? (
                          <MailOpen className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                        ) : (
                          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn('truncate text-sm', isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900')}>
                              {senderName(m)}
                            </p>
                            <span className="shrink-0 text-[11px] text-slate-400">{formatDate(m.createdAt)}</span>
                          </div>
                          <p className="truncate text-xs text-slate-500">{m.subject ?? '(No subject)'}</p>
                          {!isRead && <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-brand" />}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Reading pane */}
          {open ? (
            <Card className="flex flex-col p-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">{open.subject ?? '(No subject)'}</h2>
                <div className="mt-2 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-light text-sm font-bold text-white">
                    {open.sender
                      ? `${open.sender.firstName[0] ?? ''}${open.sender.lastName[0] ?? ''}`
                      : '—'}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{senderName(open)}</p>
                    <p className="text-xs text-slate-500">{formatDate(open.createdAt)}</p>
                  </div>
                </div>
              </div>
              <p className="flex-1 whitespace-pre-line pt-5 text-sm leading-relaxed text-slate-700">{open.body}</p>

              <div className="mt-6 border-t border-slate-100 pt-4">
                {!replying && !replySent && (
                  <button onClick={startReply} className="btn-primary">
                    <Reply className="h-4 w-4" /> Reply
                  </button>
                )}

                {replySent && (
                  <p className="text-sm font-medium text-green-600">Reply sent successfully.</p>
                )}

                {replying && (
                  <form onSubmit={handleReply} className="space-y-3">
                    <textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      rows={4}
                      required
                      placeholder={`Reply to ${senderName(open)}…`}
                      className="input-field resize-y"
                    />
                    {replyError && <p className="text-xs font-medium text-red-600">{replyError}</p>}
                    <div className="flex gap-2">
                      <button type="submit" disabled={sending} className="btn-primary disabled:opacity-60">
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Send Reply
                      </button>
                      <button type="button" onClick={() => setReplying(false)} className="btn-secondary">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </Card>
          ) : (
            <Card className="flex items-center justify-center p-10">
              <p className="text-sm text-slate-400">Select a message to read it.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
