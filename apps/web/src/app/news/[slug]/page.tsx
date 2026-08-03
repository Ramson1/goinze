"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";
import Container from "@/components/Container";
import CommentSection from "@/components/CommentSection";
import { websiteApi, type NewsPostRecord } from "@/lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Split a CMS body string into display paragraphs. */
function paragraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default function NewsArticlePage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params?.slug[0] : params?.slug;

  const [post, setPost] = useState<NewsPostRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    websiteApi
      .newsBySlug(slug)
      .then((res) => active && setPost(res))
      .catch(() => active && setNotFound(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <Container className="py-24 text-center text-slate-500">Loading article…</Container>
    );
  }

  if (notFound || !post) {
    return (
      <Container className="py-24 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Article not found</h1>
        <p className="mt-2 text-slate-600">
          The article you&apos;re looking for doesn&apos;t exist or is no longer published.
        </p>
        <Link
          href="/news"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark"
        >
          <ArrowLeft className="h-4 w-4" /> Back to News
        </Link>
      </Container>
    );
  }

  const cover = post.coverUrl ?? `https://picsum.photos/seed/${post.slug}/1600/900`;

  return (
    <>
      {/* Article hero */}
      <div data-hero className="relative h-[360px] w-full sm:h-[440px]">
        <Image src={cover} alt={post.title} fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />
        <Container className="absolute inset-x-0 bottom-0 pb-8">
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to News
          </Link>
          {post.category && (
            <span className="mt-3 inline-block rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
              {post.category}
            </span>
          )}
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold leading-tight text-white sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/85">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {formatDate(post.publishedAt ?? post.createdAt)}
            </span>
          </div>
        </Container>
      </div>

      {/* Article body */}
      <Container className="py-12">
        <div className="mx-auto max-w-3xl">
          {post.excerpt && (
            <p className="mb-6 border-l-4 border-brand pl-4 text-lg italic leading-relaxed text-slate-600">
              {post.excerpt}
            </p>
          )}
          <article className="space-y-5">
            {paragraphs(post.body).map((paragraph, i) => (
              <p key={i} className="text-base leading-relaxed text-slate-700">
                {paragraph}
              </p>
            ))}
          </article>
          <CommentSection />
        </div>
      </Container>
    </>
  );
}
