import type { ReactNode } from "react";

/**
 * Rounded, subtly-shadowed surface used for content cards.
 */
export default function Card({
  children,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-100 bg-white shadow-card ${
        hover ? "transition-shadow duration-300 hover:shadow-card-hover" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
