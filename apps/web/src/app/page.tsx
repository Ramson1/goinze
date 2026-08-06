"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Loader2,
  MapPin,
  Megaphone,
  Quote,
} from "lucide-react";
import { currentAcademicSession } from "@goinze/shared-utils";
import Container from "@/components/Container";
import Section from "@/components/Section";
import Card from "@/components/Card";
import HeroSlider from "@/components/HeroSlider";
import {
  announcementsApi,
  websiteApi,
  type AnnouncementRecord,
  type EventRecord,
  type GalleryItemRecord,
  type NewsPostRecord,
} from "@/lib/api";
import {
  asArray,
  defaultStats,
  defaultTestimonials,
  getBlockBody,
  initialsOf,
  useContentBlocks,
} from "@/lib/content";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function eventDay(iso: string) {
  return String(new Date(iso).getDate()).padStart(2, "0");
}

function eventMonth(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short" });
}

function eventTime(startsAt: string, endsAt: string | null) {
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const start = new Date(startsAt);
  if (!endsAt) return fmt(start);
  return `${fmt(start)} – ${fmt(new Date(endsAt))}`;
}

/** Fallback cover image so cards stay visual when a post has no cover. */
function coverFor(post: NewsPostRecord) {
  return post.coverUrl ?? `https://picsum.photos/seed/${post.slug}/900/560`;
}

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-brand" />
      <span className="ml-2 text-sm text-slate-400">Loading…</span>
    </div>
  );
}

export default function HomePage() {
  const [news, setNews] = useState<NewsPostRecord[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [gallery, setGallery] = useState<GalleryItemRecord[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const { blocks } = useContentBlocks();

  useEffect(() => {
    let active = true;
    websiteApi
      .news()
      .then((res) => active && setNews(res.slice(0, 3)))
      .catch(() => undefined)
      .finally(() => active && setNewsLoading(false));
    announcementsApi
      .list()
      .then((res) => active && setAnnouncements(res.slice(0, 5)))
      .catch(() => undefined)
      .finally(() => active && setAnnouncementsLoading(false));
    websiteApi
      .events()
      .then((res) => active && setEvents(res.slice(0, 3)))
      .catch(() => undefined)
      .finally(() => active && setEventsLoading(false));
    websiteApi
      .gallery()
      .then((res) =>
        active && setGallery(res.filter((g) => g.type === "IMAGE").slice(0, 6)),
      )
      .catch(() => undefined)
      .finally(() => active && setGalleryLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // Static marketing blocks from the CMS (with graceful defaults).
  const stats = (() => {
    const cms = asArray(getBlockBody(blocks, "home.stats"));
    return cms.length > 0 ? cms : defaultStats;
  })();
  const testimonials = (() => {
    const cms = asArray(getBlockBody(blocks, "home.testimonials"));
    return cms.length > 0 ? cms : defaultTestimonials;
  })();

  const latestNews = news;
  const upcomingEvents = events;
  const galleryPreview = gallery;

  return (
    <>
      <HeroSlider blocks={blocks} />

      {/* Admission CTA strip */}
      <div className="bg-gradient-to-r from-brand-dark to-brand">
        <Container className="flex flex-col items-center justify-between gap-5 py-8 sm:flex-row">
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-white sm:text-2xl">
              Admissions for {currentAcademicSession()} are now open
            </h2>
            <p className="mt-1 text-sm text-white/85">
              Secure your place at Goinze International School of Medical Health
              Science and Technology — applications close soon.
            </p>
          </div>
          <Link
            href="/admission"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            Start Your Application
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Container>
      </div>

      {/* Latest News */}
      <Section
        eyebrow="Stay Informed"
        title="Latest News"
        subtitle="The latest stories and updates from across the university."
      >
        {newsLoading ? (
          <LoadingSkeleton />
        ) : latestNews.length === 0 ? (
          <p className="text-center text-slate-500">No news published yet — check back soon.</p>
        ) : (
          <>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {latestNews.map((post) => (
                <Card key={post.id} hover className="overflow-hidden">
                  <Link href={`/news/${post.slug}`} className="group block">
                    <div className="relative h-44 w-full overflow-hidden">
                      <Image
                        src={coverFor(post)}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {post.category && (
                        <span className="absolute left-3 top-3 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
                          {post.category}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-slate-900 transition-colors group-hover:text-brand">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{post.excerpt}</p>
                      )}
                      <p className="mt-3 text-xs text-slate-500">
                        {formatDate(post.publishedAt ?? post.createdAt)}
                      </p>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/news"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors hover:text-brand-dark"
              >
                View all news
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </Section>

      {/* Announcements */}
      <Section className="bg-slate-50" eyebrow="Notice Board" title="Announcements">
        {announcementsLoading ? (
          <LoadingSkeleton />
        ) : announcements.length === 0 ? (
          <p className="text-center text-slate-500">No announcements right now.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand">
                    <Megaphone className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-medium text-slate-800">{item.title}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3 pl-12 sm:pl-0">
                  {item.audience && item.audience !== "ALL" && (
                    <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                      {item.audience}
                    </span>
                  )}
                  <span className="text-xs text-slate-500">{formatDate(item.publishedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Upcoming Events */}
      <Section
        eyebrow="What's On"
        title="Upcoming Events"
        subtitle="Mark your calendar for these upcoming university events."
      >
        {eventsLoading ? (
          <LoadingSkeleton />
        ) : upcomingEvents.length === 0 ? (
          <p className="text-center text-slate-500">No upcoming events scheduled.</p>
        ) : (
          <>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event) => (
                <Card key={event.id} hover className="flex gap-5 p-6">
                  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-brand text-white">
                    <span className="text-2xl font-extrabold leading-none">
                      {eventDay(event.startsAt)}
                    </span>
                    <span className="text-xs font-semibold uppercase">
                      {eventMonth(event.startsAt)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
                    {event.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{event.description}</p>
                    )}
                    <div className="mt-3 space-y-1 text-xs text-slate-500">
                      <p className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-brand" />
                        {eventTime(event.startsAt, event.endsAt)}
                      </p>
                      {event.location && (
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-brand" />
                          {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/events"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors hover:text-brand-dark"
              >
                View all events
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </Section>

      {/* Gallery preview */}
      <Section className="bg-slate-50" eyebrow="Campus Life" title="Gallery">
        {galleryLoading ? (
          <LoadingSkeleton />
        ) : galleryPreview.length === 0 ? (
          <p className="text-center text-slate-500">Gallery photos coming soon.</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {galleryPreview.map((photo) => (
                <div key={photo.id} className="group relative overflow-hidden rounded-xl shadow-card">
                  <div className="relative h-48 w-full">
                    <Image
                      src={photo.url}
                      alt={photo.caption ?? "Campus photo"}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  {photo.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/70 to-transparent p-3 pt-8">
                      <p className="text-sm font-medium text-white">{photo.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/gallery"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors hover:text-brand-dark"
              >
                Explore the gallery
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </Section>

      {/* Testimonials */}
      <Section
        eyebrow="Voices"
        title="What Our Community Says"
        subtitle="Hear from students, parents and alumni about the Goinze experience."
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t) => (
            <Card key={t.name} hover className="flex flex-col p-6">
              <Quote className="h-7 w-7 text-brand-light" />
              <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-700">"{t.quote}"</p>
              <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-light text-sm font-bold text-white">
                  {t.initials ?? initialsOf(t.name ?? "")}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Stats band */}
      <div className="bg-gradient-to-r from-brand-dark via-brand to-brand-light">
        <Container className="grid grid-cols-2 gap-8 py-14 text-center lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-4xl font-extrabold text-white sm:text-5xl">{stat.value}</p>
              <p className="mt-2 text-sm font-medium uppercase tracking-wider text-white/80">
                {stat.label}
              </p>
            </div>
          ))}
        </Container>
      </div>
    </>
  );
}
