import type { ReactNode } from "react";
import Container from "./Container";

/**
 * Vertical page section with an optional heading block.
 */
export default function Section({
  children,
  className = "",
  id,
  title,
  subtitle,
  eyebrow,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  return (
    <section id={id} className={`py-16 sm:py-20 ${className}`}>
      <Container>
        {(title || subtitle || eyebrow) && (
          <div className="mb-10 max-w-2xl">
            {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
            {title && (
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {title}
              </h2>
            )}
            {subtitle && <p className="mt-3 text-lg text-slate-600">{subtitle}</p>}
          </div>
        )}
        {children}
      </Container>
    </section>
  );
}
