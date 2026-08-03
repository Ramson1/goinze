import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

/** Standard content card used across the portal. */
export default function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/80 bg-white shadow-card',
        hover && 'transition hover:shadow-card-hover',
        className,
      )}
    >
      {children}
    </div>
  );
}
