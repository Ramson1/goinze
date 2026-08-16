'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  ClipboardList,
  BookOpen,
  Wallet,
  Receipt,
  GraduationCap,
  FileSearch,
  CalendarDays,
  MonitorSmartphone,
  Bell,
  Download,
  MessageSquare,
  Newspaper,
  Users,
  Settings,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'My Profile', href: '/profile', icon: User },
    ],
  },
  {
    title: 'Academics',
    items: [
      { label: 'Course Registration', href: '/course-registration', icon: ClipboardList },
      { label: 'Registered Courses', href: '/registered-courses', icon: BookOpen },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Payments', href: '/payments', icon: Wallet },
      { label: 'Receipts', href: '/receipts', icon: Receipt },
    ],
  },
  {
    title: 'Results & Exams',
    items: [
      { label: 'Results', href: '/results', icon: GraduationCap },
      { label: 'Result Checker', href: '/result-checker', icon: FileSearch },
      { label: 'Academic Calendar', href: '/academic-calendar', icon: CalendarDays },
      { label: 'CBT Dashboard', href: '/cbt', icon: MonitorSmartphone },
    ],
  },
  {
    title: 'Campus Life',
    items: [
      { label: 'Notifications', href: '/notifications', icon: Bell },
      { label: 'Downloads', href: '/downloads', icon: Download },
      { label: 'Messages', href: '/messages', icon: MessageSquare },
      { label: 'Articles', href: '/articles', icon: Newspaper },
      { label: 'Alumni', href: '/alumni', icon: Users },
    ],
  },
  {
    title: 'Account',
    items: [{ label: 'Settings', href: '/settings', icon: Settings }],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ open, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-gradient-to-b from-brand-dark via-brand to-brand-dark text-white shadow-2xl transition-all duration-200 ease-in-out lg:translate-x-0',
          collapsed ? 'w-[68px]' : 'w-72',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand */}
        <div className={cn('flex shrink-0 items-center border-b border-white/10', collapsed ? 'justify-center px-2 py-5' : 'justify-between gap-3 px-5 py-5')}>
          <Link href="/dashboard" className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-3')} onClick={onClose}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1">
              <Image
                src="/logo.png"
                alt="Goinzeschool logo"
                width={36}
                height={36}
                className="h-full w-full object-contain"
              />
            </span>
            {!collapsed && (
              <span>
                <span className="block text-base font-bold leading-tight">Goinzeschool</span>
                <span className="block text-[11px] font-medium uppercase tracking-wider text-blue-200">
                  Student Portal
                </span>
              </span>
            )}
          </Link>
          {!collapsed && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-blue-100 transition hover:bg-white/10 lg:hidden"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Collapse toggle - desktop only */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            'absolute -right-3 top-20 z-50 hidden rounded-full border border-gray-200 bg-white p-1.5 text-gray-600 shadow-sm hover:bg-gray-50 lg:block',
            collapsed && 'left-1/2 -right-3 -translate-x-1/2',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>

        {/* Navigation */}
        <nav className={cn('scrollbar-thin flex-1 overflow-y-auto', collapsed ? 'px-2 py-4' : 'px-3 py-4')}>
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className={cn('mb-5', collapsed && 'mb-3')}>
              {!collapsed && (
                <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-blue-200/70">
                  {group.title}
                </p>
              )}
              <ul className={cn(collapsed ? 'space-y-1' : 'space-y-0.5')}>
                {group.items.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          'group flex items-center rounded-lg text-sm font-medium transition',
                          collapsed
                            ? 'justify-center px-2 py-2.5'
                            : 'gap-3 px-3 py-2.5',
                          active
                            ? 'bg-white/15 text-white shadow-inner ring-1 ring-white/10'
                            : 'text-blue-100/80 hover:bg-white/10 hover:text-white',
                        )}
                      >
                        <item.icon
                          className={cn(
                            'h-[18px] w-[18px] shrink-0 transition',
                            active ? 'text-red-400' : 'text-blue-200/70 group-hover:text-amber-300',
                          )}
                        />
                        {!collapsed && item.label}
                        {!collapsed && active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-red-400" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="shrink-0 border-t border-white/10 px-5 py-4">
            <p className="text-[10px] font-semibold leading-tight text-blue-200/80">
              GOINZE INTERNATIONAL SCHOOL OF MEDICAL HEALTH SCIENCE AND TECHNOLOGY
            </p>
            <p className="mt-1 text-[11px] text-blue-200/50">
              Student Portal
            </p>
            <p className="mt-2 text-[10px] leading-tight text-blue-200/40">
              Designed &amp; developed by{' '}
              <a
                href="https://rhemaexpertsolutions.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-200/60 hover:text-white"
              >
                Rhema Expert Solutions
              </a>
            </p>
            <p className="text-[10px] text-blue-200/40">
              <a href="tel:+2348035226642" className="text-blue-200/40 hover:text-white">
                +234 803 522 6642
              </a>
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
