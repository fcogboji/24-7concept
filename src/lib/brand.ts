/** Odoo-inspired palette used across brand + landing. */
export const BRAND = {
  teal: "#00A09D",
  purple: "#714B67",
  orange: "#F0A202",
  sky: "#00A3D3",
  emerald: "#00A04A",
  navy: "#1F2A44",
  /** Landing CTA green (from brand reference). */
  forest: "#205B22",
} as const;

/**
 * Landing page palette: one green accent on white, with a near-black green ink for
 * headings. Kept separate from `BRAND` (the multicolour app/logo palette).
 */
export const LAND = {
  green: "#1C7C4A",
  greenDark: "#14603A",
  greenMid: "#2E9160",
  /** Section wash / icon tiles. */
  greenSoft: "#E9F4EE",
  greenFaint: "#F5FAF7",
  ink: "#12332A",
  body: "#5A6B62",
  line: "#E4EDE8",
} as const;

/** Per-letter colours of the "faztino" wordmark. */
export const BRAND_WORDMARK_COLORS = [
  BRAND.teal,
  BRAND.purple,
  BRAND.orange,
  BRAND.sky,
  BRAND.emerald,
  BRAND.teal,
  BRAND.purple,
];

export const BRAND_WORDMARK = "faztino";

export const BRAND_MARK_VIEWBOX = "0 0 48 48";

/**
 * Shapes of the logo mark: overlapping teal / purple circles with an orange chat
 * tail on a white tile. Kept as markup so the React component and the generated
 * PNG icons (favicon, PWA, Apple touch) all draw the same artwork.
 */
export const BRAND_MARK_SHAPES = `
  <rect x="1" y="1" width="46" height="46" rx="11" fill="#ffffff" stroke="#E8E8E8" stroke-width="1" />
  <circle cx="18" cy="22" r="11" fill="${BRAND.teal}" fill-opacity="0.92" />
  <circle cx="30" cy="22" r="11" fill="${BRAND.purple}" fill-opacity="0.88" />
  <rect x="14" y="31" width="14" height="5.5" rx="2.75" fill="${BRAND.orange}" transform="rotate(-18 14 31)" />
  <circle cx="15.5" cy="16.5" r="3.2" fill="${BRAND.sky}" fill-opacity="0.85" />
`;

export function brandMarkSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${BRAND_MARK_VIEWBOX}" width="48" height="48" fill="none">${BRAND_MARK_SHAPES}</svg>`;
}

/**
 * Satori (used by `ImageResponse`) cannot rasterize inline SVG children, so the mark
 * is passed to `<img>` as a data URI instead.
 */
export function brandMarkDataUri(): string {
  return `data:image/svg+xml;base64,${Buffer.from(brandMarkSvg()).toString("base64")}`;
}
