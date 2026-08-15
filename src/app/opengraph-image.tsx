import { ImageResponse } from "next/og";
import { BRAND_WORDMARK, BRAND_WORDMARK_COLORS, brandMarkDataUri } from "@/lib/brand";

export const alt = "Faztino — AI chatbots that capture leads and book appointments 24/7";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0f1c 0%, #111a2e 100%)",
          padding: "80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          <img src={brandMarkDataUri()} width={180} height={180} alt="" />
          <div
            style={{
              display: "flex",
              fontSize: 190,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            {BRAND_WORDMARK.split("").map((char, i) => (
              <span key={i} style={{ color: BRAND_WORDMARK_COLORS[i % BRAND_WORDMARK_COLORS.length] }}>
                {char}
              </span>
            ))}
          </div>
        </div>
        <div
          style={{
            marginTop: 48,
            color: "#cbd5e1",
            fontSize: 38,
            fontWeight: 500,
            textAlign: "center",
            maxWidth: 960,
            lineHeight: 1.3,
          }}
        >
          AI chatbots that capture leads and book appointments 24/7
        </div>
      </div>
    ),
    { ...size },
  );
}
