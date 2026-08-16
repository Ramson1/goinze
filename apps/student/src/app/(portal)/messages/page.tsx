'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Edit3,
  Loader2,
  MessageSquarePlus,
  Reply,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import {
  conversationApi,
  commApi,
  studentApi,
  type ConversationSummary,
  type ConversationMessage,
  type ContactItem,
} from '@/lib/api';
import { cn } from '@/lib/utils';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return formatTime(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function otherParticipant(
  conv: ConversationSummary,
  currentUserId: string,
): { firstName: string; lastName: string } | null {
  if (conv.isGroup) return null;
  const other = conv.participants.find((p) => p.userId !== currentUserId);
  return other?.user ?? null;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Input
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ConversationMessage | null>(null);
  const [editingMsg, setEditingMsg] = useState<ConversationMessage | null>(null);

  // Compose
  const [composeOpen, setComposeOpen] = useState(false);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [contactQuery, setContactQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState('');
  const [searchingContacts, setSearchingContacts] = useState(false);
  const [creating, setCreating] = useState(false);

  // Mobile
  const [showThread, setShowThread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resolve current user ID from student profile
  useEffect(() => {
    studentApi.profile()
      .then((p) => { if (p?.userId) setCurrentUserId(p.userId); })
      .catch(() => undefined);

    conversationApi.list()
      .then((convs) => { setConversations(convs); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Poll conversations
  useEffect(() => {
    const interval = setInterval(() => {
      conversationApi.list().then(setConversations).catch(() => undefined);
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Load messages for active conversation
  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    try {
      const data = await conversationApi.get(convId);
      setMessages(data.messages ?? []);
      conversationApi.markRead(convId).catch(() => undefined);
    } catch { /* ignore */ }
    setLoadingMessages(false);
  }, []);

  useEffect(() => {
    if (activeId) {
      loadMessages(activeId);
      setShowThread(true);
    }
  }, [activeId, loadMessages]);

  // Poll messages
  useEffect(() => {
    if (!activeId) return;
    const interval = setInterval(() => {
      conversationApi.messages(activeId).then(setMessages).catch(() => undefined);
    }, 10_000);
    return () => clearInterval(interval);
  }, [activeId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Search contacts
  useEffect(() => {
    if (!composeOpen) return;
    setSearchingContacts(true);
    conversationApi.contacts(contactQuery || undefined)
      .then(setContacts)
      .catch(() => undefined)
      .finally(() => setSearchingContacts(false));
  }, [contactQuery, composeOpen]);

  async function handleSend() {
    if (!input.trim() || !activeId) return;
    setSending(true);
    try {
      if (editingMsg) {
        const updated = await conversationApi.editMessage(editingMsg.id, input.trim());
        setMessages((prev) => prev.map((m) => m.id === updated.id ? updated : m));
        setEditingMsg(null);
      } else {
        const msg = await conversationApi.sendMessage(activeId, {
          body: input.trim(),
          replyToId: replyTo?.id,
        });
        setMessages((prev) => [...prev, msg]);
        setReplyTo(null);
      }
      setInput('');
      conversationApi.list().then(setConversations).catch(() => undefined);
    } catch { /* ignore */ }
    setSending(false);
    inputRef.current?.focus();
  }

  async function handleDelete(msg: ConversationMessage) {
    try {
      await conversationApi.deleteMessage(msg.id);
      setMessages((prev) =>
        prev.map((m) => m.id === msg.id ? { ...m, deletedAt: new Date().toISOString(), body: '' } : m),
      );
    } catch { /* ignore */ }
  }

  async function handleCreateConversation() {
    if (selectedContacts.size === 0) return;
    setCreating(true);
    try {
      const conv = await conversationApi.create({
        recipientIds: Array.from(selectedContacts),
        title: selectedContacts.size > 1 || groupName.trim() ? groupName.trim() || undefined : undefined,
        isGroup: selectedContacts.size > 1,
      });
      setConversations((prev) => [conv as unknown as ConversationSummary, ...prev]);
      setActiveId(conv.id);
      setComposeOpen(false);
      resetCompose();
    } catch { /* ignore */ }
    setCreating(false);
  }

  function resetCompose() {
    setSelectedContacts(new Set());
    setGroupName('');
    setContactQuery('');
  }

  function toggleContact(id: string) {
    setSelectedContacts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const activeConv = conversations.find((c) => c.id === activeId);

  return (
    <div className="mx-auto flex h-[calc(100vh-10rem)] max-w-6xl flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-sm text-slate-500">Chat with your lecturers, advisers, and admin.</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Left panel — Conversation list */}
        <div className={cn(
          'flex w-full flex-col border-r border-slate-200 md:w-80 lg:w-96',
          showThread && 'hidden md:flex',
        )}>
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Conversations</h2>
            <button
              type="button"
              onClick={() => setComposeOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-brand"
              aria-label="New message"
            >
              <MessageSquarePlus className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : conversations.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-slate-400">
                No conversations yet. Start a new chat!
              </div>
            ) : (
              conversations.map((conv) => {
                const other = otherParticipant(conv, currentUserId);
                const name = conv.isGroup
                  ? conv.title ?? 'Group Chat'
                  : other ? `${other.firstName} ${other.lastName}` : 'Unknown';
                const isActive = conv.id === activeId;
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setActiveId(conv.id)}
                    className={cn(
                      'flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3 text-left transition',
                      isActive ? 'bg-brand/5' : 'hover:bg-slate-50',
                    )}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                      {name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">{name}</span>
                        {conv.lastMessage && (
                          <span className="shrink-0 text-[10px] text-slate-400">{formatDay(conv.lastMessage.createdAt)}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-slate-500">
                          {conv.lastMessage?.body ?? 'No messages yet'}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right panel — Chat thread */}
        <div className={cn(
          'flex flex-1 flex-col',
          !showThread && 'hidden md:flex',
        )}>
          {!activeConv ? (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
              Select a conversation to start chatting
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setShowThread(false)}
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 md:hidden"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                  {(activeConv.isGroup
                    ? activeConv.title ?? 'G'
                    : otherParticipant(activeConv, currentUserId)?.firstName?.charAt(0) ?? '?'
                  ).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {activeConv.isGroup
                      ? activeConv.title ?? 'Group Chat'
                      : (() => { const o = otherParticipant(activeConv, currentUserId); return o ? `${o.firstName} ${o.lastName}` : 'Unknown'; })()
                    }
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading messages…
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-400">
                    No messages yet. Say hello!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderId === currentUserId;
                    const isDeleted = !!msg.deletedAt;
                    return (
                      <div key={msg.id} className={cn('flex gap-2', isMine ? 'justify-end' : 'justify-start')}>
                        {!isMine && (
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                            {msg.sender?.firstName?.charAt(0) ?? '?'}
                          </span>
                        )}
                        <div className={cn('group relative max-w-[75%]', isMine ? 'items-end' : 'items-start')}>
                          {msg.replyTo && !isDeleted && (
                            <div className="mb-1 rounded-t-lg border-l-2 border-brand/40 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
                              <span className="font-semibold text-slate-600">
                                {msg.replyTo.sender?.firstName ?? 'Unknown'}
                              </span>
                              <p className="line-clamp-1">{msg.replyTo.body}</p>
                            </div>
                          )}
                          <div
                            className={cn(
                              'rounded-2xl px-4 py-2 text-sm leading-relaxed',
                              isDeleted
                                ? 'bg-slate-100 italic text-slate-400'
                                : isMine
                                  ? 'rounded-br-md bg-brand text-white'
                                  : 'rounded-bl-md bg-slate-100 text-slate-800',
                            )}
                          >
                            {isDeleted ? 'This message was deleted' : msg.body}
                          </div>
                          <div className={cn('mt-1 flex items-center gap-2 text-[10px] text-slate-400', isMine ? 'justify-end' : 'justify-start')}>
                            <span>{formatTime(msg.createdAt)}</span>
                            {msg.editedAt && <span>(edited)</span>}
                          </div>

                          {!isDeleted && (
                            <div className={cn(
                              'absolute -top-1 opacity-0 transition-opacity group-hover:opacity-100',
                              isMine ? '-left-16' : '-right-16',
                            )}>
                              <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
                                <button
                                  type="button"
                                  onClick={() => { setReplyTo(msg); setEditingMsg(null); setInput(''); inputRef.current?.focus(); }}
                                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-brand"
                                  title="Reply"
                                >
                                  <Reply className="h-3.5 w-3.5" />
                                </button>
                                {isMine && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => { setEditingMsg(msg); setReplyTo(null); setInput(msg.body); inputRef.current?.focus(); }}
                                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-brand"
                                      title="Edit"
                                    >
                                      <Edit3 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(msg)}
                                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                                      title="Delete"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply/Edit indicator */}
              {(replyTo || editingMsg) && (
                <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-500">
                  <span className="font-semibold text-brand">
                    {editingMsg ? 'Editing message' : `Replying to ${replyTo?.sender?.firstName ?? 'message'}`}
                  </span>
                  <span className="line-clamp-1 flex-1">{editingMsg?.body ?? replyTo?.body}</span>
                  <button
                    type="button"
                    onClick={() => { setReplyTo(null); setEditingMsg(null); setInput(''); }}
                    className="rounded p-0.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Input */}
              <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={editingMsg ? 'Edit message…' : 'Type a message…'}
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-white transition hover:bg-brand-dark disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingMsg ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Compose modal */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-900">New Conversation</h3>
              <button type="button" onClick={() => { setComposeOpen(false); resetCompose(); }} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              {selectedContacts.size > 1 && (
                <div>
                  <label className="label">Group Name (optional)</label>
                  <input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g. Study Group"
                    className="input"
                  />
                </div>
              )}

              <div>
                <label className="label">Search Contacts</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={contactQuery}
                    onChange={(e) => setContactQuery(e.target.value)}
                    placeholder="Search by name or email…"
                    className="input pl-9"
                  />
                </div>
              </div>

              {selectedContacts.size > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(selectedContacts).map((id) => {
                    const c = contacts.find((x) => x.id === id);
                    return c ? (
                      <span key={id} className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
                        {c.firstName} {c.lastName}
                        <button type="button" onClick={() => toggleContact(id)} className="rounded-full p-0.5 hover:bg-brand/20">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-200">
                {searchingContacts ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" /> Searching…
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">No contacts found</div>
                ) : (
                  contacts.map((c) => {
                    const selected = selectedContacts.has(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleContact(c.id)}
                        className={cn(
                          'flex w-full items-center gap-3 border-b border-slate-50 px-4 py-2.5 text-left transition',
                          selected ? 'bg-brand/5' : 'hover:bg-slate-50',
                        )}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                          {c.firstName.charAt(0)}{c.lastName.charAt(0)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">{c.firstName} {c.lastName}</p>
                          <p className="truncate text-xs text-slate-400">{c.role?.replace('_', ' ')} · {c.email}</p>
                        </div>
                        {selected && <Check className="h-4 w-4 shrink-0 text-brand" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button type="button" onClick={() => { setComposeOpen(false); resetCompose(); }} className="btn-secondary">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateConversation}
                disabled={selectedContacts.size === 0 || creating}
                className="btn-primary disabled:opacity-50"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {creating ? 'Creating…' : 'Start Chat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
