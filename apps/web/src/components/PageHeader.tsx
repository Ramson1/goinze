import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Container from "./Container";

/**
 * Page hero band with breadcrumb navigation, used by all inner pages.
 */
export default function PageHeader({
  title,
  subtitle,
  breadcrumb,
}: {
  title: string;
  subtitle?: string;
  breadcrumb: string;
}) {
  return (
    <div data-hero className="bg-gradient-to-br from-brand-dark via-brand to-brand-light">
      {/* Extra top padding clears the fixed floating navbar pill. */}
      <Container className="pb-14 pt-28 sm:pb-16 sm:pt-32">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-white/80">
          <Link href="/" className="transition-colors hover:text-white">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-white">{breadcrumb}</span>
        </nav>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        {subtitle && <p className="mt-3 max-w-2xl text-lg text-white/90">{subtitle}</p>}
      </Container>
    </div>
  );
}
