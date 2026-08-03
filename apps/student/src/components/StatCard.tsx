import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  /** Tailwind classes for the icon bubble, e.g. "bg-blue-50 text-brand". */
  iconClass?: string;
  className?: string;
}

/** Dashboard metric card with an icon bubble. */
export default function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconClass = 'bg-blue-50 text-brand',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/80 bg-white p-5 shadow-card transition hover:shadow-card-hover',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', iconClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
