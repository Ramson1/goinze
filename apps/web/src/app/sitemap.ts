import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

/** Server-side API base for enumerating dynamic content (news posts). */
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_URL ??
  "https://goinze-backend.vercel.app/api/v1";

/** Revalidate the sitemap hourly so newly published news appears quickly. */
export const revalidate = 3600;

const staticRoutes: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/admission", priority: 0.9, changeFrequency: "weekly" },
  { path: "/academics", priority: 0.9, changeFrequency: "weekly" },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.8, changeFrequency: "monthly" },
  { path: "/news", priority: 0.7, changeFrequency: "daily" },
  { path: "/events", priority: 0.7, changeFrequency: "daily" },
  { path: "/alumni", priority: 0.6, changeFrequency: "monthly" },
  { path: "/gallery", priority: 0.6, changeFrequency: "weekly" },
  { path: "/staff", priority: 0.5, changeFrequency: "monthly" },
];

async function fetchNewsSlugs(): Promise<{ slug: string; updatedAt?: string }[]> {
  try {
    const res = await fetch(`${API_URL}/website/news`, {
      next: { revalidate: 3600 },
      headers: { accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .map((n: any) => ({ slug: n?.slug, updatedAt: n?.publishedAt ?? n?.createdAt }))
      .filter((n: any) => typeof n.slug === "string" && n.slug.length > 0);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${SITE.url}${r.path === "/" ? "" : r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const news = await fetchNewsSlugs();
  const newsEntries: MetadataRoute.Sitemap = news.map((n) => ({
    url: `${SITE.url}/news/${n.slug}`,
    lastModified: n.updatedAt ? new Date(n.updatedAt) : now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...newsEntries];
}
