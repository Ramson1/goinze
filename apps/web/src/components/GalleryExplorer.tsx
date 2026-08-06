"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { websiteApi, type GalleryItemRecord } from "@/lib/api";

/**
 * Photo grid with album tab filtering, backed by the live CMS gallery.
 */
export default function GalleryExplorer() {
  const [photos, setPhotos] = useState<GalleryItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [album, setAlbum] = useState<string>("All");
  const [lightbox, setLightbox] = useState<GalleryItemRecord | null>(null);

  useEffect(() => {
    let active = true;
    websiteApi
      .gallery()
      .then((res) => active && setPhotos(res.filter((g) => g.type === "IMAGE")))
      .catch(() => undefined)
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // Derive album tabs from whatever albums actually exist in the CMS.
  const albums = useMemo(() => {
    const unique = Array.from(
      new Set(photos.map((p) => p.album).filter((a): a is string => Boolean(a))),
    );
    return ["All", ...unique];
  }, [photos]);

  const filtered = album === "All" ? photos : photos.filter((p) => p.album === album);

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightbox) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(null);
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  if (loading) {
    return <p className="py-16 text-center text-slate-500">Loading gallery…</p>;
  }

  if (photos.length === 0) {
    return <p className="py-16 text-center text-slate-500">Gallery photos coming soon.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {albums.map((a) => (
          <button
            key={a}
            onClick={() => setAlbum(a)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              album === a
                ? "bg-brand text-white"
                : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-brand"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((photo) => (
          <figure
            key={photo.id}
            className="group relative overflow-hidden rounded-xl shadow-card transition-shadow hover:shadow-card-hover"
          >
            <button
              type="button"
              onClick={() => setLightbox(photo)}
              className="relative block h-56 w-full cursor-zoom-in"
            >
              <Image
                src={photo.url}
                alt={photo.caption ?? "Campus photo"}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </button>
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 to-transparent p-4 pt-8">
              {photo.album && (
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  {photo.album}
                </span>
              )}
              {photo.caption && <p className="text-sm font-medium text-white">{photo.caption}</p>}
            </figcaption>
          </figure>
        ))}
      </div>

      {/* Lightbox modal */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="relative max-h-[85vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={lightbox.url}
              alt={lightbox.caption ?? "Campus photo"}
              width={1200}
              height={800}
              sizes="90vw"
              className="max-h-[85vh] w-auto object-contain"
              priority
            />
            {(lightbox.caption || lightbox.album) && (
              <div className="absolute inset-x-0 bottom-0 rounded-b-lg bg-gradient-to-t from-black/70 to-transparent px-5 py-4 pt-10">
                {lightbox.album && (
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                    {lightbox.album}
                  </span>
                )}
                {lightbox.caption && (
                  <p className="text-sm font-medium text-white">{lightbox.caption}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
