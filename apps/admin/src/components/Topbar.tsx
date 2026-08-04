'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  CreditCard,
  FileText,
  Globe,
  IdCard,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  MonitorSmartphone,
  Newspaper,
  ScrollText,
  Search,
  Settings,
  User,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authApi, notificationApi, studentsApi, staffApi, financeApi, type NotificationRecord } from '@/lib/api';

// ── Navigation items (mirrors Sidebar) ──────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  group: string;
  keywords?: string[];
}

const allNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, group: 'Overview' },
  { label: 'Analytics', href: '/analytics', icon: BarChart3, group: 'Overview', keywords: ['charts', 'graphs', 'statistics'] },
  { label: 'Reports', href: '/reports', icon: FileText, group: 'Overview', keywords: ['export', 'pdf'] },
  { label: 'Students', href: '/students', icon: Users, group: 'People', keywords: ['pupils', 'enrollees'] },
  { label: 'Admissions', href: '/admissions', icon: UserPlus, group: 'People', keywords: ['applications', 'applicants', 'new students'] },
  { label: 'Staff', href: '/staff', icon: Briefcase, group: 'People', keywords: ['employees', 'lecturers', 'workers'] },
  { label: 'Departments', href: '/departments', icon: Building2, group: 'Academics', keywords: ['faculties', 'units'] },
  { label: 'Courses', href: '/courses', icon: BookOpen, group: 'Academics', keywords: ['subjects', 'classes'] },
  { label: 'Academic Session', href: '/academic-session', icon: Calendar, group: 'Academics', keywords: ['semester', 'term', 'session'] },
  { label: 'Payments', href: '/payments', icon: CreditCard, group: 'Finance', keywords: ['fees', 'transactions', 'receipts', 'billing'] },
  { label: 'Results', href: '/results', icon: ClipboardCheck, group: 'Assessment', keywords: ['grades', 'scores', 'exams'] },
  { label: 'CBT', href: '/cbt', icon: MonitorSmartphone, group: 'Assessment', keywords: ['computer based test', 'exams', 'online test'] },
  { label: 'Website CMS', href: '/website-cms', icon: Globe, group: 'Content', keywords: ['website', 'content blocks', 'gallery'] },
  { label: 'News', href: '/news', icon: Newspaper, group: 'Content', keywords: ['articles', 'announcements'] },
  { label: 'Events', href: '/events', icon: CalendarDays, group: 'Content', keywords: ['calendar', 'activities'] },
  { label: 'Digital ID Cards', href: '/digital-id-cards', icon: IdCard, group: 'System', keywords: ['identity', 'badges'] },
  { label: 'Communication', href: '/communication', icon: MessageSquare, group: 'System', keywords: ['messages', 'notifications', 'announcements'] },
  { label: 'Settings', href: '/settings', icon: Settings, group: 'System', keywords: ['preferences', 'configuration', 'school profile'] },
  { label: 'Audit Logs', href: '/audit-logs', icon: ScrollText, group: 'System', keywords: ['security', 'history', 'activity'] },
];

// ── Search result types ─────────────────────────────────────────────

interface ContentResult {
  id: string;
  label: string;
  sublabel: string;
  href: string;
}

// ── Debounce helper ─────────────────────────────────────────────────

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ── Topbar ──────────────────────────────────────────────────────────

interface TopbarProps {
  onMenuClick: () => void;
}

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Search results
  const [navResults, setNavResults] = useState<NavItem[]>([]);
  const [studentResults, setStudentResults] = useState<ContentResult[]>([]);
  const [staffResults, setStaffResults] = useState<ContentResult[]>([]);
  const [paymentResults, setPaymentResults] = useState<ContentResult[]>([]);
  const [searching, setSearching] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  // Fetch user profile and notifications on mount
  useEffect(() => {
    authApi.me().then(setProfile).catch(() => undefined);
    notificationApi.list().then(setNotifications).catch(() => undefined);
  }, []);

  // ── Search logic ────────────────────────────────────────────────

  useEffect(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) {
      setNavResults([]);
      setStudentResults([]);
      setStaffResults([]);
      setPaymentResults([]);
      setSearching(false);
      return;
    }

    // Filter navigation items
    const matched = allNavItems.filter((item) => {
      const hay = `${item.label} ${item.group} ${(item.keywords ?? []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
    setNavResults(matched);

    // Search content via API (parallel)
    setSearching(true);
    Promise.allSettled([
      studentsApi.list({ search: q, pageSize: 3 }).then((res) =>
        res.items.map((s) => ({
          id: s.id,
          label: `${s.firstName} ${s.lastName}`,
          sublabel: s.matricNumber ?? s.programme?.name ?? s.status,
          href: `/students`,
        })),
      ),
      staffApi.list({ search: q, pageSize: 3 }).then((res) =>
        res.items.map((s) => ({
          id: s.id,
          label: `${s.firstName} ${s.lastName}`,
          sublabel: s.designation ?? s.department?.name ?? '',
          href: `/staff`,
        })),
      ),
      financeApi.payments({ search: q, pageSize: 3 }).then((res) =>
        res.items.map((p) => ({
          id: p.id,
          label: p.reference,
          sublabel: `₦${p.amount} — ${p.student?.firstName ?? ''} ${p.student?.lastName ?? ''}`.trim(),
          href: `/payments`,
        })),
      ),
    ]).then(([stu, stf, pay]) => {
      setStudentResults(stu.status === 'fulfilled' ? stu.value : []);
      setStaffResults(stf.status === 'fulfilled' ? stf.value : []);
      setPaymentResults(pay.status === 'fulfilled' ? pay.value : []);
    }).finally(() => setSearching(false));
  }, [debouncedQuery]);

  // Total results count for keyboard nav
  const totalResults = navResults.length + studentResults.length + staffResults.length + paymentResults.length;

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [navResults.length, studentResults.length, staffResults.length, paymentResults.length]);

  // ── Keyboard handler ────────────────────────────────────────────

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, totalResults - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      navigateToIndex(activeIndex);
    } else if (e.key === 'Escape') {
      closeSearch();
    }
  }

  function navigateToIndex(index: number) {
    let i = 0;
    // Nav results
    for (const item of navResults) {
      if (i === index) { router.push(item.href); closeSearch(); return; }
      i++;
    }
    // Student results
    for (const item of studentResults) {
      if (i === index) { router.push(item.href); closeSearch(); return; }
      i++;
    }
    // Staff results
    for (const item of staffResults) {
      if (i === index) { router.push(item.href); closeSearch(); return; }
      i++;
    }
    // Payment results
    for (const item of paymentResults) {
      if (i === index) { router.push(item.href); closeSearch(); return; }
      i++;
    }
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery('');
    inputRef.current?.blur();
  }

  // Close search when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Global keyboard shortcut: Ctrl+K or / to focus search
  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setSearchOpen(true);
      }
    }
    document.addEventListener('keydown', handleGlobalKey);
    return () => document.removeEventListener('keydown', handleGlobalKey);
  }, []);

  const unreadCount = notifications.filter((n) => n.status !== 'READ').length;
  const initials = profile
    ? `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase()
    : 'AD';

  function handleSignOut() {
    document.cookie = 'access_token=; path=/; max-age=0';
    document.cookie = 'refresh_token=; path=/; max-age=0';
    router.replace('/login');
  }

  const hasResults = totalResults > 0;
  const showDropdown = searchOpen && searchQuery.trim().length > 0;

  // Build a flat list for keyboard nav highlighting
  function getGlobalIndex(section: 'nav' | 'student' | 'staff' | 'payment', localIdx: number): number {
    let offset = 0;
    if (section === 'student') offset = navResults.length;
    else if (section === 'staff') offset = navResults.length + studentResults.length;
    else if (section === 'payment') offset = navResults.length + studentResults.length + staffResults.length;
    return offset + localIdx;
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-gray-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      {/* Mobile menu */}
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div ref={searchRef} className="relative w-full max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="search"
            placeholder="Search pages, students, staff, payments… (Ctrl+K)"
            className="input pl-9 pr-16"
            aria-label="Global search"
            value={searchQuery}
            onFocus={() => setSearchOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onKeyDown={handleKeyDown}
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 sm:block">
            Ctrl+K
          </kbd>
        </div>

        {/* Search dropdown */}
        {showDropdown && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
            {searching && !hasResults ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Searching…
              </div>
            ) : !hasResults ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No results found for &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              <ul className="py-2">
                {/* Navigation results */}
                {navResults.length > 0 && (
                  <>
                    <li className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Pages
                    </li>
                    {navResults.map((item, idx) => {
                      const globalIdx = getGlobalIndex('nav', idx);
                      const Icon = item.icon;
                      const isActive = globalIdx === activeIndex;
                      return (
                        <li key={item.href}>
                          <button
                            type="button"
                            className={cn(
                              'flex w-full items-center gap-3 px-4 py-2 text-left transition-colors',
                              isActive ? 'bg-brand/5 text-brand' : 'text-gray-700 hover:bg-gray-50',
                            )}
                            onClick={() => { router.push(item.href); closeSearch(); }}
                            onMouseEnter={() => setActiveIndex(globalIdx)}
                          >
                            <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-brand' : 'text-gray-400')} />
                            <div className="min-w-0 flex-1">
                              <span className="block text-sm font-medium">{item.label}</span>
                              <span className="block text-xs text-gray-400">{item.group}</span>
                            </div>
                            <span className="text-[10px] text-gray-300">Page</span>
                          </button>
                        </li>
                      );
                    })}
                  </>
                )}

                {/* Student results */}
                {studentResults.length > 0 && (
                  <>
                    <li className="mt-1 border-t border-gray-100 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Students
                    </li>
                    {studentResults.map((item, idx) => {
                      const globalIdx = getGlobalIndex('student', idx);
                      const isActive = globalIdx === activeIndex;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            className={cn(
                              'flex w-full items-center gap-3 px-4 py-2 text-left transition-colors',
                              isActive ? 'bg-brand/5 text-brand' : 'text-gray-700 hover:bg-gray-50',
                            )}
                            onClick={() => { router.push(item.href); closeSearch(); }}
                            onMouseEnter={() => setActiveIndex(globalIdx)}
                          >
                            <Users className={cn('h-4 w-4 shrink-0', isActive ? 'text-brand' : 'text-gray-400')} />
                            <div className="min-w-0 flex-1">
                              <span className="block text-sm font-medium">{item.label}</span>
                              <span className="block truncate text-xs text-gray-400">{item.sublabel}</span>
                            </div>
                            <span className="text-[10px] text-gray-300">Student</span>
                          </button>
                        </li>
                      );
                    })}
                  </>
                )}

                {/* Staff results */}
                {staffResults.length > 0 && (
                  <>
                    <li className="mt-1 border-t border-gray-100 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Staff
                    </li>
                    {staffResults.map((item, idx) => {
                      const globalIdx = getGlobalIndex('staff', idx);
                      const isActive = globalIdx === activeIndex;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            className={cn(
                              'flex w-full items-center gap-3 px-4 py-2 text-left transition-colors',
                              isActive ? 'bg-brand/5 text-brand' : 'text-gray-700 hover:bg-gray-50',
                            )}
                            onClick={() => { router.push(item.href); closeSearch(); }}
                            onMouseEnter={() => setActiveIndex(globalIdx)}
                          >
                            <Briefcase className={cn('h-4 w-4 shrink-0', isActive ? 'text-brand' : 'text-gray-400')} />
                            <div className="min-w-0 flex-1">
                              <span className="block text-sm font-medium">{item.label}</span>
                              <span className="block truncate text-xs text-gray-400">{item.sublabel}</span>
                            </div>
                            <span className="text-[10px] text-gray-300">Staff</span>
                          </button>
                        </li>
                      );
                    })}
                  </>
                )}

                {/* Payment results */}
                {paymentResults.length > 0 && (
                  <>
                    <li className="mt-1 border-t border-gray-100 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Payments
                    </li>
                    {paymentResults.map((item, idx) => {
                      const globalIdx = getGlobalIndex('payment', idx);
                      const isActive = globalIdx === activeIndex;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            className={cn(
                              'flex w-full items-center gap-3 px-4 py-2 text-left transition-colors',
                              isActive ? 'bg-brand/5 text-brand' : 'text-gray-700 hover:bg-gray-50',
                            )}
                            onClick={() => { router.push(item.href); closeSearch(); }}
                            onMouseEnter={() => setActiveIndex(globalIdx)}
                          >
                            <CreditCard className={cn('h-4 w-4 shrink-0', isActive ? 'text-brand' : 'text-gray-400')} />
                            <div className="min-w-0 flex-1">
                              <span className="block text-sm font-medium">{item.label}</span>
                              <span className="block truncate text-xs text-gray-400">{item.sublabel}</span>
                            </div>
                            <span className="text-[10px] text-gray-300">Payment</span>
                          </button>
                        </li>
                      );
                    })}
                  </>
                )}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-full p-2 text-gray-500 transition hover:bg-gray-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">Notifications</p>
                <Link
                  href="/notifications"
                  onClick={() => setNotifOpen(false)}
                  className="text-xs font-medium text-brand hover:text-brand-dark"
                >
                  View all
                </Link>
              </div>
              <ul className="max-h-80 divide-y divide-gray-100 overflow-y-auto">
                {notifications.length === 0 ? (
                  <li className="px-4 py-6 text-center text-xs text-gray-400">
                    No notifications yet.
                  </li>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <li
                      key={n.id}
                      className="cursor-pointer px-4 py-3 transition hover:bg-gray-50"
                      onClick={() => {
                        notificationApi.markRead(n.id).catch(() => undefined);
                        setNotifOpen(false);
                      }}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={cn(
                            'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                            n.status === 'READ' ? 'bg-gray-300' : 'bg-brand',
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800">{n.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{n.body}</p>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            type="button"
            onClick={() => setUserOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition hover:bg-gray-100"
            aria-label="User menu"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
              {initials}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold leading-tight text-gray-900">
                {profile ? `${profile.firstName} ${profile.lastName}` : 'Loading…'}
              </span>
              <span className="block text-xs leading-tight text-gray-500">
                {profile?.role?.replace('_', ' ') ?? ''}
              </span>
            </span>
            <ChevronDown
              className={cn('h-4 w-4 text-gray-400 transition-transform', userOpen && 'rotate-180')}
            />
          </button>

          {userOpen && (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">
                  {profile ? `${profile.firstName} ${profile.lastName}` : 'Loading…'}
                </p>
                <p className="mt-0.5 truncate text-xs text-gray-500">{profile?.email ?? ''}</p>
              </div>
              <ul className="py-1">
                <li>
                  <Link
                    href="/profile"
                    onClick={() => setUserOpen(false)}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User className="h-4 w-4 text-gray-400" /> My profile
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings"
                    onClick={() => setUserOpen(false)}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="h-4 w-4 text-gray-400" /> Preferences
                  </Link>
                </li>
              </ul>
              <div className="border-t border-gray-100 py-1">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
