import { cn } from '@/lib/utils';

type Tone = 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'teal' | 'purple';

const toneClasses: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  gray: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  teal: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  purple: 'bg-purple-50 text-purple-700 ring-purple-600/20',
};

const statusTone: Record<string, Tone> = {
  // positive
  active: 'green',
  admitted: 'green',
  approved: 'green',
  success: 'green',
  paid: 'green',
  published: 'green',
  completed: 'green',
  live: 'green',
  ready: 'green',
  sent: 'green',
  present: 'green',
  // attention
  pending: 'amber',
  'under review': 'amber',
  processing: 'amber',
  interview: 'amber',
  submitted: 'amber',
  'on leave': 'amber',
  scheduled: 'blue',
  'in session': 'blue',
  'in progress': 'blue',
  upcoming: 'blue',
  ongoing: 'purple',
  draft: 'gray',
  // student lifecycle
  applicant: 'blue',
  suspended: 'red',
  graduated: 'teal',
  withdrawn: 'red',
  archived: 'gray',
  // negative
  rejected: 'red',
  failed: 'red',
  overdue: 'red',
  refunded: 'red',
  cancelled: 'red',
  inactive: 'gray',
  probation: 'amber',
  // cbt lifecycle
  closed: 'gray',
  graded: 'green',
  abandoned: 'red',
};

export default function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  const tone = statusTone[key] ?? 'gray';
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset',
        toneClasses[tone],
      )}
    >
      {status}
    </span>
  );
}
