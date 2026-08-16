'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  FileText,
  Globe,
  IdCard,
  LayoutDashboard,
  Bell,
  MessageSquare,
  MonitorSmartphone,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Settings,
  UserCircle2,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** If set, only these roles can see this item. */
  roles?: string[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Analytics', href: '/analytics', icon: BarChart3 },
      { label: 'Reports', href: '/reports', icon: FileText },
    ],
  },
  {
    title: 'People',
    items: [
      { label: 'Students', href: '/students', icon: Users },
      { label: 'Admissions', href: '/admissions', icon: UserPlus },
      { label: 'Staff', href: '/staff', icon: Briefcase },
    ],
  },
  {
    title: 'Academics',
    items: [
      { label: 'Departments', href: '/departments', icon: Building2 },
      { label: 'Courses', href: '/courses', icon: BookOpen },
      { label: 'Academic Session', href: '/academic-session', icon: Calendar },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Payments', href: '/payments', icon: CreditCard },
      { label: 'Fee Structures', href: '/fee-structures', icon: FileText },
    ],
  },
  {
    title: 'Assessment',
    items: [
      { label: 'Results', href: '/results', icon: ClipboardCheck },
      { label: 'CBT', href: '/cbt', icon: MonitorSmartphone },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Website CMS', href: '/website-cms', icon: Globe },
      { label: 'News', href: '/news', icon: Newspaper },
      { label: 'Events', href: '/events', icon: CalendarDays },
      { label: 'Announcements', href: '/communication', icon: MessageSquare },
      { label: 'Messages', href: '/messages', icon: MessageSquare },
      { label: 'Notifications', href: '/notifications', icon: Bell },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Digital ID Cards', href: '/digital-id-cards', icon: IdCard, roles: ['SUPER_ADMIN'] },
      { label: 'My Profile', href: '/profile', icon: UserCircle2 },
      { label: 'Settings', href: '/settings', icon: Settings },
      { label: 'Audit Logs', href: '/audit-logs', icon: ScrollText },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  userRole?: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ open, onClose, userRole, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-blue-900 text-white transition-all duration-200 ease-in-out lg:translate-x-0',
          collapsed ? 'w-[68px]' : 'w-64',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand */}
        <div className={cn('flex h-16 shrink-0 items-center border-b border-white/10', collapsed ? 'justify-center px-2' : 'justify-between px-5')}>
          <Link href="/dashboard" className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-2.5')}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white p-0.5">
              <Image
                src="/logo.png"
                alt="Goinzeschool logo"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
            </span>
            {!collapsed && (
              <span className="text-base font-bold tracking-tight">
                Goinze<span className="text-blue-300">school</span>
              </span>
            )}
          </Link>
          {/* Mobile close */}
          {!collapsed && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-blue-200 hover:bg-white/10 lg:hidden"
              aria-label="Close sidebar"
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
            collapsed && 'left-1/2 top-20 -right-3 -translate-x-1/2',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>

        {/* Nav */}
        <nav className={cn('flex-1 overflow-y-auto', collapsed ? 'px-2 py-4' : 'px-3 py-4')}>
          {navGroups.map((group) => (
            <div key={group.title} className={cn('mb-4', collapsed && 'mb-3')}>
              {!collapsed && (
                <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-blue-300/70">
                  {group.title}
                </p>
              )}
              <ul className={cn(collapsed ? 'space-y-1' : 'space-y-0.5')}>
                {group.items
                  .filter((item) => !item.roles || (userRole && item.roles.includes(userRole)))
                  .map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          'group flex items-center rounded-lg text-sm font-medium transition-colors',
                          collapsed
                            ? 'justify-center px-2 py-2.5'
                            : 'gap-3 px-3 py-2',
                          active
                            ? 'bg-white/15 text-white ring-1 ring-white/10'
                            : 'text-blue-100/80 hover:bg-white/10 hover:text-white',
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-[18px] w-[18px] shrink-0',
                            active ? 'text-red-400' : 'text-blue-300 group-hover:text-white',
                          )}
                        />
                        {!collapsed && <span>{item.label}</span>}
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
            <p className="mt-1 text-[11px] text-blue-300/50">Admin Portal</p>
            <p className="mt-2 text-[10px] leading-tight text-blue-300/40">
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
            <p className="text-[10px] text-blue-300/40">
              <a href="tel:+2348035226642" className="text-blue-300/40 hover:text-white">
                +234 803 522 6642
              </a>
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
