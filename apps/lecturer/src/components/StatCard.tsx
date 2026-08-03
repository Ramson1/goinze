import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '@/components/Card';
import { cn } from '@/lib/cn';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  iconClassName?: string;
  trend?: ReactNode;
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconClassName,
  trend,
}: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
          {trend}
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
            iconClassName ?? 'bg-brand/10 text-brand',
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
