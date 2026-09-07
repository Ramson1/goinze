"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Section from "@/components/Section";
import GalleryExplorer from "@/components/GalleryExplorer";
import { websiteApi, type GalleryItemRecord } from "@/lib/api";

export default function GalleryPage() {
  const [videos, setVideos] = useState<GalleryItemRecord[]>([]);

  useEffect(() => {
    let active = true;
    websiteApi
      .gallery()
      .then((res) => active && setVideos(res.filter((g) => g.type === "VIDEO")))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <PageHeader
        breadcrumb="Gallery"
        title="Gallery"
        subtitle="Photos and videos capturing life at Goinze International School of Medical Health Science and Technology."
      />

      <Section eyebrow="Photos" title="Photo Albums">
        <GalleryExplorer />
      </Section>

      {videos.length > 0 && (
        <Section className="bg-slate-50" eyebrow="Watch" title="Videos">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <a
                key={video.id}
                href={video.url}
                target="_blank"
                rel="noreferrer"
                className="group overflow-hidden rounded-xl shadow-card transition-shadow hover:shadow-card-hover"
              >
                <div className="relative h-48 w-full">
                  <Image
                    src={`https://picsum.photos/seed/${video.id}/800/450`}
                    alt={video.caption ?? "Video"}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 transition-colors group-hover:bg-slate-900/40">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-brand transition-transform group-hover:scale-110">
                      <Play className="ml-1 h-6 w-6 fill-current" />
                    </span>
                  </div>
                </div>
                <div className="bg-white p-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {video.caption ?? "Campus video"}
                  </h3>
                </div>
              </a>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
