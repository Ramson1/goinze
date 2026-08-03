import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import Card from './Card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  delta?: string;
  trend?: 'up' | 'down';
  icon: LucideIcon;
  iconClassName?: string;
}

export default function StatCard({
  title,
  value,
  delta,
  trend = 'up',
  icon: Icon,
  iconClassName,
}: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">{value}</p>
        </div>
        <span
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-lg',
            iconClassName ?? 'bg-brand/10 text-brand',
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {delta && (
        <div className="mt-3 flex items-center gap-1.5 text-sm">
          {trend === 'up' ? (
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-rose-600" />
          )}
          <span
            className={cn(
              'font-medium',
              trend === 'up' ? 'text-emerald-600' : 'text-rose-600',
            )}
          >
            {delta}
          </span>
          <span className="text-gray-400">vs last term</span>
        </div>
      )}
    </Card>
  );
}
