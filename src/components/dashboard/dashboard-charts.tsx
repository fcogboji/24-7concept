"use client";

import { useCallback, useMemo, useRef, useState } from "react";

/** Decorative donut — server-friendly, no interaction. */
const TOPIC_LEGEND = [
  { label: "Pricing", color: "#0d9488" },
  { label: "Support", color: "#1e40af" },
  { label: "Features", color: "#7c3aed" },
  { label: "Other", color: "#9ca3af" },
];

const W = 560;
const H = 200;
const PAD = { top: 16, right: 16, bottom: 28, left: 36 };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
/** Y domain matches axis labels (50–250). */
const Y_MIN = 50;
const Y_MAX = 250;
const VALUES = [118, 154, 142, 182, 176, 212, 228];

function valueToY(v: number, innerH: number) {
  return PAD.top + innerH * (1 - (v - Y_MIN) / (Y_MAX - Y_MIN));
}

function clientPointToSvg(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  return pt.matrixTransform(ctm.inverse());
}

export function ConversationVolumeChart() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number } | null>(null);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const points = useMemo(() => {
    return VALUES.map((v, i) => {
      const x = PAD.left + (innerW / (VALUES.length - 1)) * i;
      const y = valueToY(v, innerH);
      return { x, y, v, day: DAYS[i] };
    });
  }, [innerH, innerW]);

  const linePath = useMemo(() => {
    return `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")}`;
  }, [points]);

  const areaPath = useMemo(() => {
    const last = points[points.length - 1];
    const first = points[0];
    return `${linePath} L ${last.x} ${PAD.top + innerH} L ${first.x} ${PAD.top + innerH} Z`;
  }, [linePath, points, innerH]);

  const updateHover = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      const wrap = wrapRef.current;
      if (!svg || !wrap) return;
      const svgP = clientPointToSvg(svg, clientX, clientY);
      if (!svgP) return;

      if (
        svgP.x < PAD.left ||
        svgP.x > W - PAD.right ||
        svgP.y < PAD.top ||
        svgP.y > PAD.top + innerH
      ) {
        setHover(null);
        setTooltipPos(null);
        return;
      }

      let nearest = 0;
      let best = Infinity;
      points.forEach((p, i) => {
        const d = Math.abs(p.x - svgP.x);
        if (d < best) {
          best = d;
          nearest = i;
        }
      });

      const p = points[nearest];
      setHover(nearest);

      const wr = wrap.getBoundingClientRect();
      const sr = svg.getBoundingClientRect();
      const px = sr.left + (p.x / W) * sr.width;
      const py = sr.top + (p.y / H) * sr.height;
      const left = Math.min(px - wr.left + 10, wr.width - 100);
      const top = Math.max(py - wr.top - 58, 4);
      setTooltipPos({ left, top });
    },
    [innerH, points]
  );

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    updateHover(e.clientX, e.clientY);
  };

  const onLeave = () => {
    setHover(null);
    setTooltipPos(null);
  };

  const active = hover != null ? points[hover] : null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Conversation volume</h3>
          <p className="text-sm text-gray-500">Daily interaction metrics</p>
        </div>
        <span className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
          Last 7 days
        </span>
      </div>

      <div ref={wrapRef} className="relative mt-4">
        <svg
          ref={svgRef}
          className="w-full touch-manipulation"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={onMove}
          onMouseLeave={onLeave}
        >
          <defs>
            <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[50, 100, 150, 200, 250].map((tick) => {
            const t = (tick - Y_MIN) / (Y_MAX - Y_MIN);
            const y = PAD.top + innerH * (1 - t);
            return (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={y}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text x={PAD.left - 8} y={y + 4} textAnchor="end" className="fill-gray-400 text-[10px]">
                  {tick}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#lineFill)" />
          <path
            d={linePath}
            fill="none"
            stroke="#0d9488"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {active && (
            <>
              <line
                x1={active.x}
                y1={PAD.top}
                x2={active.x}
                y2={PAD.top + innerH}
                stroke="#171717"
                strokeWidth="1"
                strokeDasharray="4 3"
                pointerEvents="none"
              />
              <circle
                cx={active.x}
                cy={active.y}
                r="5"
                fill="white"
                stroke="#0d9488"
                strokeWidth="2.5"
                pointerEvents="none"
              />
            </>
          )}

          <text x={PAD.left} y={H - 6} className="fill-gray-400 text-[10px]">
            Mon
          </text>
          <text x={PAD.left + innerW * 0.5 - 12} y={H - 6} className="fill-gray-400 text-[10px]">
            Thu
          </text>
          <text x={W - PAD.right - 24} y={H - 6} className="fill-gray-400 text-[10px]">
            Sun
          </text>
        </svg>

        {active && tooltipPos && (
          <div
            className="pointer-events-none absolute z-10 min-w-[4.5rem] rounded border border-neutral-900 bg-white px-2.5 py-2 shadow-sm"
            style={{ left: tooltipPos.left, top: tooltipPos.top }}
          >
            <p className="text-[11px] font-medium text-neutral-900">{active.day}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-800">
              <span className="h-0.5 w-3 rounded-full bg-[#0d9488]" aria-hidden />
              <span className="tabular-nums">{Math.round(active.v)}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function TopicDistributionChart() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900">Topic distribution</h3>
      <p className="text-sm text-gray-500">What users ask about</p>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center">
        <svg className="h-40 w-40 shrink-0 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#e5e7eb" strokeWidth="16" />
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="#0d9488"
            strokeWidth="16"
            strokeDasharray="60 100"
            strokeLinecap="round"
          />
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="#1e40af"
            strokeWidth="16"
            strokeDasharray="45 100"
            strokeDashoffset="-60"
            strokeLinecap="round"
          />
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="#7c3aed"
            strokeWidth="16"
            strokeDasharray="35 100"
            strokeDashoffset="-105"
            strokeLinecap="round"
          />
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke="#9ca3af"
            strokeWidth="16"
            strokeDasharray="30 100"
            strokeDashoffset="-140"
            strokeLinecap="round"
          />
        </svg>
        <ul className="grid w-full max-w-[200px] gap-2 text-sm">
          {TOPIC_LEGEND.map((d) => (
            <li key={d.label} className="flex items-center gap-2 text-gray-700">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              {d.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
