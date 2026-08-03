'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  User,
  IdCard,
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
      { label: 'Digital ID Card', href: '/digital-id', icon: IdCard },
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
}

export default function Sidebar({ open, onClose }: SidebarProps) {
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
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-gradient-to-b from-brand-dark via-brand to-brand-dark text-white shadow-2xl transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-5">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1">
              <Image
                src="/logo.png"
                alt="Goinzeschool logo"
                width={36}
                height={36}
                className="h-full w-full object-contain"
              />
            </span>
            <span>
              <span className="block text-base font-bold leading-tight">Goinzeschool</span>
              <span className="block text-[11px] font-medium uppercase tracking-wider text-blue-200">
                Student Portal
              </span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-blue-100 transition hover:bg-white/10 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="mb-5">
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-blue-200/70">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
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
                        {item.label}
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
        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-[11px] leading-relaxed text-blue-200/60">
            © {new Date().getFullYear()} Goinzeschool
            <br />
            Enterprise School ERP · v0.1.0
          </p>
        </div>
      </aside>
    </>
  );
}
