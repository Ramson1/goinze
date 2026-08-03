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
  MessageSquare,
  MonitorSmartphone,
  Newspaper,
  ScrollText,
  Settings,
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
    items: [{ label: 'Payments', href: '/payments', icon: CreditCard }],
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
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Digital ID Cards', href: '/digital-id-cards', icon: IdCard },
      { label: 'Communication', href: '/communication', icon: MessageSquare },
      { label: 'Settings', href: '/settings', icon: Settings },
      { label: 'Audit Logs', href: '/audit-logs', icon: ScrollText },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
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
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-blue-900 text-white transition-transform duration-200 ease-in-out lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white p-0.5">
              <Image
                src="/logo.png"
                alt="Goinzeschool logo"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
            </span>
            <span className="text-base font-bold tracking-tight">
              Goinze<span className="text-blue-300">school</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-blue-200 hover:bg-white/10 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => (
            <div key={group.title} className="mb-5">
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-blue-300/70">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
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
                        <span>{item.label}</span>
                        {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-red-400" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/10 px-5 py-4">
          <p className="text-xs text-blue-300/70">Goinzeschool ERP</p>
          <p className="text-[11px] text-blue-300/50">Admin Portal · v0.1.0</p>
        </div>
      </aside>
    </>
  );
}
