'use client';

import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  GraduationCap,
  LayoutDashboard,
  MessagesSquare,
  Settings,
  Upload,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { currentAcademicSession } from '@goinze/shared-utils';
import { cn } from '@/lib/cn';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Courses', href: '/courses', icon: BookOpen },
  { label: 'Students', href: '/students', icon: Users },
  { label: 'Attendance', href: '/attendance', icon: ClipboardCheck },
  { label: 'Upload Scores', href: '/upload-scores', icon: Upload },
  { label: 'CBT Questions', href: '/cbt-questions', icon: ClipboardList },
  { label: 'Exams', href: '/exams', icon: GraduationCap },
  { label: 'Results', href: '/results', icon: BarChart3 },
  { label: 'Messages', href: '/messages', icon: MessagesSquare },
  { label: 'Calendar', href: '/calendar', icon: CalendarDays },
  { label: 'Reports', href: '/reports', icon: FileBarChart },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-brand text-white">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1">
          <Image
            src="/logo.png"
            alt="Goinzeschool logo"
            width={36}
            height={36}
            className="h-full w-full object-contain"
          />
        </div>
        <div>
          <p className="text-base font-bold leading-tight">Goinzeschool</p>
          <p className="text-xs text-blue-100/80">Lecturer Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-blue-100/80 hover:bg-white/10 hover:text-white',
              )}
            >
              <item.icon
                className={cn('h-5 w-5', active ? 'text-red-400' : 'text-blue-200/70')}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-xs text-blue-100/70">{currentAcademicSession()} · First Semester</p>
        <p className="mt-1 text-[10px] font-semibold leading-tight text-blue-200/80">
          GOINZE INTERNATIONAL SCHOOL OF MEDICAL HEALTH SCIENCE AND TECHNOLOGY
        </p>
        <p className="mt-1 text-[11px] text-blue-100/50">
          Lecturer Portal
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
    </aside>
  );
}
