"use client";

import { useState } from "react";
import { LAND } from "@/lib/brand";
import type { DemoVideo } from "@/lib/site-settings";

const AVATARS = [
  { initials: "DC", color: "#0F766E" },
  { initials: "SB", color: "#7C3AED" },
  { initials: "RE", color: "#B45309" },
  { initials: "HS", color: "#1D4ED8" },
  { initials: "FS", color: "#BE185D" },
] as const;

const FEATURED_ON = ["WordPress", "Shopify", "Wix", "Squarespace", "Webflow"] as const;

export function DemoVideoSection({ video, label }: { video: DemoVideo; label: string | null }) {
  const [playing, setPlaying] = useState(false);
  const showPoster = Boolean(video.thumbnailUrl) && !playing;

  return (
    <section id="demo-video" className="bg-white pb-16 pt-4 sm:pb-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <span className="flex -space-x-2" aria-hidden>
            {AVATARS.map((avatar) => (
              <span
                key={avatar.initials}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white sm:text-[10px]"
                style={{ backgroundColor: avatar.color }}
              >
                {avatar.initials}
              </span>
            ))}
          </span>
          <p className="text-sm font-medium" style={{ color: LAND.body }}>
            Built for local businesses that reply faster
          </p>
        </div>

        <div className="relative mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-gray-900 shadow-[0_30px_70px_-35px_rgba(18,51,42,0.5)]">
          <div className="relative aspect-video">
            {showPoster ? (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                className="group absolute inset-0 h-full w-full cursor-pointer"
                aria-label="Play product demo video"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- remote poster from the video host, no loader needed */}
                <img
                  src={video.thumbnailUrl ?? ""}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <span className="absolute inset-0 bg-black/25 transition group-hover:bg-black/15" />
                <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-lg transition group-hover:scale-105">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill={LAND.green} aria-hidden>
                    <path d="M8 5.5l11 6.5-11 6.5z" />
                  </svg>
                </span>
              </button>
            ) : (
              <iframe
                src={video.embedUrl}
                title="Faztino product demo"
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            )}
          </div>

          <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1 text-sm font-semibold shadow-sm sm:text-xs" style={{ color: LAND.ink }}>
            {label || "Faztino product demo"}
          </span>
        </div>

        <p className="mt-10 text-center text-sm font-semibold uppercase tracking-[0.2em] text-gray-400 sm:text-xs">
          Works on
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {FEATURED_ON.map((platform) => (
            <span key={platform} className="text-sm font-semibold text-gray-400">
              {platform}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
