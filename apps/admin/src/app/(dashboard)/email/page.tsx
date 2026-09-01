'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Mail,
  Send,
  Users,
  GraduationCap,
  UserCog,
  UserPlus,
  X,
  Search,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import {
  communicationApi,
  studentsApi,
  staffApi,
  type Student,
  type StaffRecord,
} from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────

interface RecipientPerson {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'STAFF';
}

const GROUP_OPTIONS = [
  { value: 'ALL_STUDENTS', label: 'All Students', icon: GraduationCap, color: 'text-blue-600 bg-blue-50' },
  { value: 'ALL_LECTURERS', label: 'All Lecturers', icon: UserCog, color: 'text-emerald-600 bg-emerald-50' },
  { value: 'ALL_STAFF', label: 'All Staff', icon: Users, color: 'text-purple-600 bg-purple-50' },
] as const;

// ── Page ───────────────────────────────────────────────────────────

export default function EmailBlastPage() {
  // Compose state
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [groups, setGroups] = useState<string[]>([]);
  const [specificPeople, setSpecificPeople] = useState<RecipientPerson[]>([]);

  // Recipient search
  const [searchTab, setSearchTab] = useState<'students' | 'staff'>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RecipientPerson[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Send state
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Preview
  const [showPreview, setShowPreview] = useState(false);

  // Recipient count
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ── Recipient group toggle ────────────────────────────────────

  function toggleGroup(value: string) {
    setGroups((prev) =>
      prev.includes(value) ? prev.filter((g) => g !== value) : [...prev, value],
    );
    setRecipientCount(null);
  }

  function togglePerson(person: RecipientPerson) {
    setSpecificPeople((prev) => {
      const exists = prev.find((p) => p.id === person.id);
      if (exists) return prev.filter((p) => p.id !== person.id);
      return [...prev, person];
    });
    setRecipientCount(null);
  }

  function removePerson(id: string) {
    setSpecificPeople((prev) => prev.filter((p) => p.id !== id));
    setRecipientCount(null);
  }

  // ── Search for individual recipients ──────────────────────────

  const doSearch = useCallback(async (q: string, tab: 'students' | 'staff') => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      if (tab === 'students') {
        const res = await studentsApi.list({ search: q, pageSize: 20 });
        setSearchResults(
          res.items
            .filter((s: Student) => s.email)
            .map((s: Student) => ({
              id: s.id,
              email: s.email!,
              name: `${s.firstName} ${s.lastName}`,
              role: 'STUDENT' as const,
            })),
        );
      } else {
        const res = await staffApi.list({ search: q, pageSize: 20 });
        setSearchResults(
          res.items
            .filter((s: StaffRecord) => s.email)
            .map((s: StaffRecord) => ({
              id: s.id,
              email: s.email!,
              name: `${s.firstName} ${s.lastName}`,
              role: 'STAFF' as const,
            })),
        );
      }
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  function handleSearchInput(value: string) {
    setSearchQuery(value);
    setShowDropdown(true);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(value, searchTab), 300);
  }

  function switchSearchTab(tab: 'students' | 'staff') {
    setSearchTab(tab);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  }

  // ── Recipient count preview ───────────────────────────────────

  async function fetchRecipientCount() {
    if (groups.length === 0 && specificPeople.length === 0) {
      setRecipientCount(0);
      return;
    }
    setCounting(true);
    try {
      const recipients = await communicationApi.previewEmailBlast({
        groups,
        specificUserIds: specificPeople.map((p) => p.id),
      });
      setRecipientCount(recipients.length);
    } catch {
      setRecipientCount(null);
    } finally {
      setCounting(false);
    }
  }

  // Auto-fetch count when selection changes (debounced)
  useEffect(() => {
    if (groups.length === 0 && specificPeople.length === 0) {
      setRecipientCount(null);
      return;
    }
    const t = setTimeout(fetchRecipientCount, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, specificPeople.length]);

  // ── Send ──────────────────────────────────────────────────────

  const canSend = subject.trim() && body.trim() && (groups.length > 0 || specificPeople.length > 0);

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const res = await communicationApi.sendEmailBlast({
        subject: subject.trim(),
        body: body.trim(),
        groups,
        specificUserIds: specificPeople.map((p) => p.id),
      });
      setResult(res);
      if (res.sent > 0) {
        setSubject('');
        setBody('');
        setGroups([]);
        setSpecificPeople([]);
        setRecipientCount(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send emails');
    } finally {
      setSending(false);
    }
  }

  // ── Preview HTML ──────────────────────────────────────────────

  const previewHtml = useMemo(() => {
    if (!body.trim()) return '';
    return `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;margin:0;padding:16px;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:linear-gradient(135deg,#1e3a5f,#0f766e);padding:24px 28px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:18px;font-weight:700;">Goinze International School</h1>
    </div>
    <div style="padding:28px;">${body}</div>
    <div style="background:#f8fafc;padding:16px 28px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:11px;color:#94a3b8;">Official email from Goinze International School</p>
    </div>
  </div>
</body></html>`;
  }, [body]);

  // ── Render ────────────────────────────────────────────────────

  return (
    <>
      <PageHeader
        title="Email Blasts"
        subtitle="Send branded emails to students, lecturers, or specific individuals."
      />

      {/* Success / Error banners */}
      {result && result.sent > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          Successfully sent {result.sent} email{result.sent !== 1 ? 's' : ''}
          {result.failed > 0 && <span className="text-amber-600">({result.failed} failed)</span>}
          <button onClick={() => setResult(null)} className="ml-auto text-emerald-500 hover:text-emerald-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* ─── Compose Panel ─────────────────────────────────── */}
        <Card
          title="Compose Email"
          subtitle="Write your message and choose recipients"
          className="xl:col-span-2"
        >
          <div className="space-y-5 p-5">
            {/* Subject */}
            <div>
              <label htmlFor="email-subject" className="label">
                Subject
              </label>
              <input
                id="email-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Important: Exam Schedule Update"
                className="input"
              />
            </div>

            {/* Recipient Groups */}
            <div>
              <label className="label">Recipient Groups</label>
              <div className="space-y-2">
                {GROUP_OPTIONS.map((opt) => {
                  const active = groups.includes(opt.value);
                  const Icon = opt.icon;
                  return (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition ${
                        active
                          ? 'border-brand bg-brand/5 text-brand'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggleGroup(opt.value)}
                        className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                      />
                      <span className={`flex h-7 w-7 items-center justify-center rounded-md ${opt.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      {opt.label}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Individual Recipients */}
            <div>
              <label className="label">
                Or Add Specific People
                {specificPeople.length > 0 && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                    {specificPeople.length} selected
                  </span>
                )}
              </label>

              {/* Search */}
              <div className="relative">
                <div className="flex items-center rounded-lg border border-gray-200 bg-white focus-within:border-brand focus-within:ring-1 focus-within:ring-brand">
                  <Search className="ml-3 h-4 w-4 shrink-0 text-gray-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onFocus={() => searchQuery && setShowDropdown(true)}
                    placeholder="Search by name or email..."
                    className="w-full border-none bg-transparent px-2 py-2.5 text-sm outline-none"
                  />
                  {searching && <Loader2 className="mr-3 h-4 w-4 animate-spin text-gray-400" />}
                </div>

                {/* Tab switcher */}
                <div className="mt-1.5 flex gap-1">
                  <button
                    type="button"
                    onClick={() => switchSearchTab('students')}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      searchTab === 'students'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    Students
                  </button>
                  <button
                    type="button"
                    onClick={() => switchSearchTab('staff')}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      searchTab === 'staff'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    Staff
                  </button>
                </div>

                {/* Dropdown results */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {searchResults.map((person) => {
                      const alreadyAdded = specificPeople.some((p) => p.id === person.id);
                      return (
                        <button
                          key={person.id}
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() => {
                            togglePerson(person);
                            setShowDropdown(false);
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-gray-50 ${
                            alreadyAdded ? 'opacity-50' : ''
                          }`}
                        >
                          <div>
                            <p className="font-medium text-gray-900">{person.name}</p>
                            <p className="text-xs text-gray-500">{person.email}</p>
                          </div>
                          {alreadyAdded ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <UserPlus className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected people chips */}
              {specificPeople.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {specificPeople.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 rounded-full bg-gray-100 py-1 pl-2.5 pr-1 text-xs font-medium text-gray-700"
                    >
                      {p.name}
                      <button
                        type="button"
                        onClick={() => removePerson(p.id)}
                        className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-gray-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Recipient count */}
            {(groups.length > 0 || specificPeople.length > 0) && (
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                {counting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                ) : (
                  <Users className="h-4 w-4 text-gray-400" />
                )}
                {counting
                  ? 'Counting recipients...'
                  : recipientCount !== null
                    ? `${recipientCount} recipient${recipientCount !== 1 ? 's' : ''} will receive this email`
                    : 'Select recipients...'}
              </div>
            )}

            {/* Body */}
            <div>
              <label htmlFor="email-body" className="label">
                Email Body
                <span className="ml-1 font-normal text-gray-400">(HTML supported)</span>
              </label>
              <textarea
                id="email-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                placeholder="Write your email content here... You can use HTML tags for formatting."
                className="input resize-none font-mono text-sm"
              />
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setBody((prev) => prev + '<p></p>')
                  }
                  className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
                >
                  &lt;p&gt;
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setBody((prev) => prev + '<strong></strong>')
                  }
                  className="rounded bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600 hover:bg-gray-200"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setBody((prev) => prev + '<em></em>')
                  }
                  className="rounded bg-gray-100 px-2 py-0.5 text-xs italic text-gray-600 hover:bg-gray-200"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setBody((prev) => prev + '<a href="https://"></a>')
                  }
                  className="rounded bg-gray-100 px-2 py-0.5 text-xs text-blue-600 underline hover:bg-gray-200"
                >
                  Link
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setBody(
                      (prev) =>
                        prev +
                        '<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>',
                    )
                  }
                  className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
                >
                  List
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                disabled={!body.trim()}
                className="btn-secondary flex items-center gap-1.5 disabled:opacity-50"
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend || sending}
                className="btn-primary flex flex-1 items-center justify-center gap-2 disabled:opacity-60"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {sending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </Card>

        {/* ─── Live Preview Panel ────────────────────────────── */}
        <Card
          title="Live Preview"
          subtitle="How the email will appear to recipients"
          className="xl:col-span-3"
        >
          {body.trim() ? (
            <div className="p-5">
              <div className="overflow-hidden rounded-xl border border-gray-200">
                {/* Email chrome */}
                <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-500">From:</span>
                    <span className="text-gray-700">Goinze International School</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-500">Subject:</span>
                    <span className="font-semibold text-gray-900">
                      {subject.trim() || '(No subject)'}
                    </span>
                  </div>
                </div>
                {/* Preview iframe */}
                <iframe
                  srcDoc={previewHtml}
                  title="Email preview"
                  className="h-[500px] w-full border-0 bg-white"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-5 py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                <Mail className="h-6 w-6 text-gray-400" />
              </div>
              <p className="mt-4 text-sm font-medium text-gray-500">
                Start typing your email body to see a preview
              </p>
              <p className="mt-1 text-xs text-gray-400">
                The email will be wrapped in a school-branded template
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* ─── Full Preview Modal ──────────────────────────────── */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="text-base font-semibold text-gray-900">Email Preview</h3>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6">
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-500">From:</span>
                    <span className="text-gray-700">Goinze International School</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-500">To:</span>
                    <span className="text-gray-700">
                      {recipientCount !== null
                        ? `${recipientCount} recipient${recipientCount !== 1 ? 's' : ''}`
                        : 'Recipients'}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-500">Subject:</span>
                    <span className="font-semibold text-gray-900">
                      {subject.trim() || '(No subject)'}
                    </span>
                  </div>
                </div>
                <iframe
                  srcDoc={previewHtml}
                  title="Full email preview"
                  className="h-[500px] w-full border-0 bg-white"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button type="button" onClick={() => setShowPreview(false)} className="btn-secondary">
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPreview(false);
                  handleSend();
                }}
                disabled={!canSend || sending}
                className="btn-primary flex items-center gap-2 disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {sending ? 'Sending...' : 'Send Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
