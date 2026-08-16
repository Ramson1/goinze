'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BookOpen,
  Calendar,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Download,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  MonitorSmartphone,
  Newspaper,
  Receipt,
  Search,
  Settings,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { commApi, contentApi, type NotificationRecord } from '@/lib/api';
import { useStudent } from '@/lib/student-context';
import { cn } from '@/lib/utils';

function clearTokenCookies() {
  document.cookie = 'gz_access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  document.cookie = 'gz_refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
}

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
  { label: 'My Profile', href: '/profile', icon: User, group: 'Overview', keywords: ['bio', 'personal'] },
  { label: 'Course Registration', href: '/course-registration', icon: ClipboardList, group: 'Academics', keywords: ['register', 'enrol'] },
  { label: 'Registered Courses', href: '/registered-courses', icon: BookOpen, group: 'Academics', keywords: ['subjects', 'classes'] },
  { label: 'Payments', href: '/payments', icon: Wallet, group: 'Finance', keywords: ['fees', 'transactions', 'receipts', 'billing'] },
  { label: 'Receipts', href: '/receipts', icon: Receipt, group: 'Finance', keywords: ['proof', 'payment history'] },
  { label: 'Results', href: '/results', icon: GraduationCap, group: 'Results & Exams', keywords: ['grades', 'scores', 'exams'] },
  { label: 'Academic Calendar', href: '/academic-calendar', icon: Calendar, group: 'Results & Exams', keywords: ['dates', 'schedule'] },
  { label: 'CBT Dashboard', href: '/cbt', icon: MonitorSmartphone, group: 'Results & Exams', keywords: ['computer based test', 'online test'] },
  { label: 'Notifications', href: '/notifications', icon: Bell, group: 'Campus Life', keywords: ['alerts', 'messages'] },
  { label: 'Downloads', href: '/downloads', icon: Download, group: 'Campus Life', keywords: ['files', 'documents'] },
  { label: 'Messages', href: '/messages', icon: MessageSquare, group: 'Campus Life', keywords: ['inbox', 'chat'] },
  { label: 'Articles', href: '/articles', icon: Newspaper, group: 'Campus Life', keywords: ['news', 'blog'] },
  { label: 'Alumni', href: '/alumni', icon: Users, group: 'Campus Life', keywords: ['graduates', 'former students'] },
  { label: 'Settings', href: '/settings', icon: Settings, group: 'Account', keywords: ['preferences', 'configuration'] },
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

// ── Dynamic session helper ──────────────────────────────────────────

function computeCurrentSession(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed: 0=Jan, 6=July
  // July–June cycle: if month >= 6 (July+), session starts this year
  const sessionStart = month >= 6 ? year : year - 1;
  return `${sessionStart}/${sessionStart + 1}`;
}

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();
  const { profile } = useStudent();
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);

  // Search results
  const [navResults, setNavResults] = useState<NavItem[]>([]);
  const [newsResults, setNewsResults] = useState<ContentResult[]>([]);
  const [eventResults, setEventResults] = useState<ContentResult[]>([]);
  const [contentResults, setContentResults] = useState<ContentResult[]>([]);
  const [searching, setSearching] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  // Fetch notifications on mount + poll every 30s
  useEffect(() => {
    function fetchNotifs() {
      commApi.notifications().then(setNotifications).catch(() => undefined);
    }
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30_000);
    return () => clearInterval(interval);
  }, []);

  const unread = notifications.filter((n) => n.status !== 'READ').length;
  const initials = profile
    ? `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`
    : '—';

  // Display session: prefer backend value, fallback to dynamic computation
  const displaySession = profile?.session || computeCurrentSession();
  const displayDepartment = profile?.department || profile?.faculty || '';

  // ── Search logic ────────────────────────────────────────────────

  useEffect(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) {
      setNavResults([]);
      setNewsResults([]);
      setEventResults([]);
      setContentResults([]);
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
      // News (client-side filter)
      contentApi.news().then((news) =>
        news
          .filter((n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q))
          .slice(0, 3)
          .map((n) => ({
            id: n.id,
            label: n.title,
            sublabel: n.category ?? 'News',
            href: '/articles',
          })),
      ),
      // Events (client-side filter)
      contentApi.events().then((events) =>
        events
          .filter((e) => e.title.toLowerCase().includes(q) || (e.description ?? '').toLowerCase().includes(q))
          .slice(0, 3)
          .map((e) => ({
            id: e.id,
            label: e.title,
            sublabel: e.startsAt ? new Date(e.startsAt).toLocaleDateString() : '',
            href: '/academic-calendar',
          })),
      ),
      // CMS Content blocks (client-side filter)
      contentApi.content().then((blocks) =>
        blocks
          .filter((b) => b.key.toLowerCase().includes(q) || (b.title ?? '').toLowerCase().includes(q))
          .slice(0, 3)
          .map((b) => ({
            id: b.id,
            label: b.title ?? b.key,
            sublabel: b.key,
            href: '/dashboard',
          })),
      ),
    ]).then(([nws, evt, cms]) => {
      setNewsResults(nws.status === 'fulfilled' ? nws.value : []);
      setEventResults(evt.status === 'fulfilled' ? evt.value : []);
      setContentResults(cms.status === 'fulfilled' ? cms.value : []);
    }).finally(() => setSearching(false));
  }, [debouncedQuery]);

  // Total results count for keyboard nav
  const totalResults =
    navResults.length + newsResults.length + eventResults.length + contentResults.length;

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [navResults.length, newsResults.length, eventResults.length, contentResults.length]);

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
    const allSections: ContentResult[][] = [newsResults, eventResults, contentResults];

    let i = 0;
    // Nav results (special - use href directly)
    for (const item of navResults) {
      if (i === index) { router.push(item.href); closeSearch(); return; }
      i++;
    }
    // All other content sections
    for (const section of allSections) {
      for (const item of section) {
        if (i === index) { router.push(item.href); closeSearch(); return; }
        i++;
      }
    }
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery('');
    inputRef.current?.blur();
  }

  function getGlobalIndex(
    section: 'nav' | 'news' | 'event' | 'content',
    localIdx: number,
  ): number {
    const offsets: Record<string, number> = {
      nav: 0,
      news: navResults.length,
      event: navResults.length + newsResults.length,
      content: navResults.length + newsResults.length + eventResults.length,
    };
    return (offsets[section] ?? 0) + localIdx;
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
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

  function handleLogout() {
    clearTokenCookies();
    router.push('/login');
  }

  const hasResults = totalResults > 0;
  const showDropdown = searchOpen && searchQuery.trim().length > 0;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: mobile menu + session */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-900">{displaySession}</p>
            <p className="text-xs text-slate-500">{displayDepartment}</p>
          </div>
        </div>

        {/* Center: Search */}
        <div ref={searchRef} className="relative hidden w-full max-w-md md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="search"
              placeholder="Search pages, news, events… (Ctrl+K)"
              className={cn(
                'w-full rounded-lg py-2 pl-9 pr-16 text-base transition-all outline-none',
                'border-transparent bg-transparent focus:border-transparent focus:ring-0',
                'placeholder:text-slate-400 text-slate-800',
                searchOpen && 'bg-slate-50',
              )}
              aria-label="Global search"
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onKeyDown={handleKeyDown}
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:block">
              Ctrl+K
            </kbd>
          </div>

          {/* Search dropdown */}
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
              {searching && !hasResults ? (
                <div className="px-4 py-8 text-center text-sm text-slate-400">
                  Searching…
                </div>
              ) : !hasResults ? (
                <div className="px-4 py-8 text-center text-sm text-slate-400">
                  No results found for &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                <ul className="py-2">
                  {/* Navigation results */}
                  {navResults.length > 0 && (
                    <>
                      <li className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
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
                                isActive ? 'bg-brand/5 text-brand' : 'text-slate-700 hover:bg-slate-50',
                              )}
                              onClick={() => { router.push(item.href); closeSearch(); }}
                              onMouseEnter={() => setActiveIndex(globalIdx)}
                            >
                              <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-brand' : 'text-slate-400')} />
                              <div className="min-w-0 flex-1">
                                <span className="block text-sm font-medium">{item.label}</span>
                                <span className="block text-xs text-slate-400">{item.group}</span>
                              </div>
                              <span className="text-[10px] text-slate-300">Page</span>
                            </button>
                          </li>
                        );
                      })}
                    </>
                  )}

                  {/* News results */}
                  {newsResults.length > 0 && (
                    <>
                      <li className="mt-1 border-t border-slate-100 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        News
                      </li>
                      {newsResults.map((item, idx) => {
                        const globalIdx = getGlobalIndex('news', idx);
                        const isActive = globalIdx === activeIndex;
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              className={cn(
                                'flex w-full items-center gap-3 px-4 py-2 text-left transition-colors',
                                isActive ? 'bg-brand/5 text-brand' : 'text-slate-700 hover:bg-slate-50',
                              )}
                              onClick={() => { router.push(item.href); closeSearch(); }}
                              onMouseEnter={() => setActiveIndex(globalIdx)}
                            >
                              <Newspaper className={cn('h-4 w-4 shrink-0', isActive ? 'text-brand' : 'text-slate-400')} />
                              <div className="min-w-0 flex-1">
                                <span className="block text-sm font-medium">{item.label}</span>
                                <span className="block truncate text-xs text-slate-400">{item.sublabel}</span>
                              </div>
                              <span className="text-[10px] text-slate-300">News</span>
                            </button>
                          </li>
                        );
                      })}
                    </>
                  )}

                  {/* Event results */}
                  {eventResults.length > 0 && (
                    <>
                      <li className="mt-1 border-t border-slate-100 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Events
                      </li>
                      {eventResults.map((item, idx) => {
                        const globalIdx = getGlobalIndex('event', idx);
                        const isActive = globalIdx === activeIndex;
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              className={cn(
                                'flex w-full items-center gap-3 px-4 py-2 text-left transition-colors',
                                isActive ? 'bg-brand/5 text-brand' : 'text-slate-700 hover:bg-slate-50',
                              )}
                              onClick={() => { router.push(item.href); closeSearch(); }}
                              onMouseEnter={() => setActiveIndex(globalIdx)}
                            >
                              <CalendarDays className={cn('h-4 w-4 shrink-0', isActive ? 'text-brand' : 'text-slate-400')} />
                              <div className="min-w-0 flex-1">
                                <span className="block text-sm font-medium">{item.label}</span>
                                <span className="block truncate text-xs text-slate-400">{item.sublabel}</span>
                              </div>
                              <span className="text-[10px] text-slate-300">Event</span>
                            </button>
                          </li>
                        );
                      })}
                    </>
                  )}

                  {/* CMS Content results */}
                  {contentResults.length > 0 && (
                    <>
                      <li className="mt-1 border-t border-slate-100 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Content
                      </li>
                      {contentResults.map((item, idx) => {
                        const globalIdx = getGlobalIndex('content', idx);
                        const isActive = globalIdx === activeIndex;
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              className={cn(
                                'flex w-full items-center gap-3 px-4 py-2 text-left transition-colors',
                                isActive ? 'bg-brand/5 text-brand' : 'text-slate-700 hover:bg-slate-50',
                              )}
                              onClick={() => { router.push(item.href); closeSearch(); }}
                              onMouseEnter={() => setActiveIndex(globalIdx)}
                            >
                              <LayoutDashboard className={cn('h-4 w-4 shrink-0', isActive ? 'text-brand' : 'text-slate-400')} />
                              <div className="min-w-0 flex-1">
                                <span className="block text-sm font-medium">{item.label}</span>
                                <span className="block truncate text-xs text-slate-400">{item.sublabel}</span>
                              </div>
                              <span className="text-[10px] text-slate-300">CMS</span>
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

        {/* Right: notifications + avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 animate-fade-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card-hover">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">Notifications</p>
                  <Link
                    href="/notifications"
                    onClick={() => setNotifOpen(false)}
                    className="text-xs font-medium text-brand hover:text-brand-dark"
                  >
                    View all
                  </Link>
                </div>
                <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                  {notifications.length === 0 && (
                    <li className="px-4 py-6 text-center text-xs text-slate-400">
                      No notifications yet.
                    </li>
                  )}
                  {notifications.slice(0, 5).map((n) => (
                    <li
                      key={n.id}
                      className="cursor-pointer px-4 py-3 transition hover:bg-slate-50"
                      onClick={() => {
                        commApi.markNotificationRead(n.id).catch(() => undefined);
                        setNotifOpen(false);
                      }}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={cn(
                            'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                            n.status === 'READ' ? 'bg-slate-300' : 'bg-brand',
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900">{n.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.body}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Avatar menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-slate-100"
              aria-label="Account menu"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-light text-sm font-bold text-white ring-2 ring-blue-100">
                {initials}
              </span>
              <span className="hidden text-left md:block">
                <span className="block text-sm font-semibold leading-tight text-slate-900">
                  {profile?.firstName} {profile?.lastName}
                </span>
                <span className="block text-xs text-slate-500">
                  {profile?.currentLevel ? `${profile.currentLevel} Level` : ''} · {profile?.matricNo ?? ''}
                </span>
              </span>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 animate-fade-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card-hover">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {profile?.firstName} {profile?.middleName ?? ''} {profile?.lastName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{profile?.email ?? ''}</p>
                </div>
                <ul className="py-1">
                  <li>
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <User className="h-4 w-4 text-slate-400" /> My Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <Settings className="h-4 w-4 text-slate-400" /> Settings
                    </Link>
                  </li>
                </ul>
                <div className="border-t border-slate-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
