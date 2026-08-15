import { ImageResponse } from "next/og";
import { brandMarkDataUri } from "@/lib/brand";

/**
 * Favicon / PWA / Apple touch icons are generated from the same artwork as
 * `BrandLogo` so the mark never drifts between the UI and installed app icons.
 *
 * `padding` keeps the glyph inside the maskable safe zone (~80% of the canvas) so
 * Android does not crop it when applying a circular or squircle mask.
 */
export function renderBrandMark(size: number): ImageResponse {
  const inset = Math.round(size * 0.08);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        <img
          src={brandMarkDataUri()}
          width={size - inset * 2}
          height={size - inset * 2}
          alt=""
        />
      </div>
    ),
    { width: size, height: size },
  );
}
