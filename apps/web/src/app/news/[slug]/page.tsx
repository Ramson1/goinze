import type { Metadata } from "next";
import NewsArticleClient from "./NewsArticleClient";
import { JsonLd, buildPageMetadata, articleJsonLd } from "@/lib/seo";

/** Server-side API base (generateMetadata runs on the server). */
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_URL ??
  "https://goinze-backend.vercel.app/api/v1";

interface NewsPost {
  title: string;
  slug: string;
  excerpt?: string | null;
  body?: string;
  coverUrl?: string | null;
  publishedAt?: string | null;
  createdAt?: string;
}

async function fetchPost(slug: string): Promise<NewsPost | null> {
  try {
    const res = await fetch(`${API_URL}/website/news/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data && typeof data === "object" && data.title ? (data as NewsPost) : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) {
    return buildPageMetadata({
      title: "News Article",
      description: "Article not found on Goinze International School news.",
      path: `/news/${slug}`,
      noIndex: true,
    });
  }
  return buildPageMetadata({
    title: post.title,
    description:
      post.excerpt ??
      `${post.title} — news from Goinze International School of Medical Health Science and Technology, Abuja.`,
    path: `/news/${post.slug}`,
    type: "article",
  });
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchPost(slug);
  return (
    <>
      <NewsArticleClient />
      {post && <JsonLd data={articleJsonLd(post)} />}
    </>
  );
}
