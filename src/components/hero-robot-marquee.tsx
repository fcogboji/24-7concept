"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const CARD_BASE =
  "relative shrink-0 overflow-hidden rounded-xl lg:rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.35)] ring-1 ring-white/10";

const INTERVAL_MS = 3000;
const TRANSITION_MS = 380;

type Item = { src: string; alt: string };

/**
 * Three robot cards in a row: smooth slide one card every 2s, infinite loop
 * (strip is A B C A B C; after sliding to the duplicate ABC we reset without a flash).
 */
export function HeroRobotMarquee({ images }: { images: readonly Item[] }) {
  const loop = [...images, ...images];
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [slidePx, setSlidePx] = useState(0);
  const [cardWidth, setCardWidth] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [transition, setTransition] = useState(true);

  useLayoutEffect(() => {
    const vp = viewportRef.current;
    const track = trackRef.current;
    if (!vp || !track) return;

    function measure() {
      const v = viewportRef.current;
      const tr = trackRef.current;
      if (!v || !tr) return;
      const w = v.clientWidth;
      const gapStr = getComputedStyle(tr).gap;
      const gap = gapStr.includes("px") ? parseFloat(gapStr) || 0 : 16;
      const cw = (w - 2 * gap) / 3;
      setCardWidth(cw);
      setSlidePx(cw + gap);
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (index !== 3) return;
    const t = window.setTimeout(() => {
      setTransition(false);
      setIndex(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTransition(true));
      });
    }, TRANSITION_MS);
    return () => window.clearTimeout(t);
  }, [index]);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const id = window.setInterval(() => {
      setIndex((i) => {
        if (i === 3) return 3;
        if (i === 2) return 3;
        return i + 1;
      });
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  const offset = slidePx > 0 ? index * slidePx : 0;
  const transform = `translate3d(${-offset}px,0,0)`;

  return (
    <div ref={viewportRef} className="relative w-full max-w-full overflow-hidden py-2">
      <div
        ref={trackRef}
        className="flex gap-3 sm:gap-4 md:gap-5 xl:gap-6"
        style={{
          width: "max-content",
          transform,
          transition: transition ? `transform ${TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)` : "none",
          willChange: "transform",
        }}
      >
        {loop.map((img, i) => (
          <div
            key={`${img.src}-${i}`}
            className={[CARD_BASE, i % 3 === 1 ? "z-[2] scale-[1.02] lg:scale-105" : "z-[1]"].join(" ")}
            style={
              cardWidth != null && cardWidth > 0
                ? { width: cardWidth, aspectRatio: "3 / 4", flex: "0 0 auto" }
                : { width: "31%", aspectRatio: "3 / 4", flex: "0 0 auto", minWidth: 88, maxWidth: 210 }
            }
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 30vw, 210px"
              priority={i === 0}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
