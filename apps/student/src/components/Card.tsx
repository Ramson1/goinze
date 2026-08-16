import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

/** Standard content card used across the portal. */
export default function Card({ children, className, hover = false, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/80 bg-white shadow-card',
        hover && 'transition hover:shadow-card-hover',
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
