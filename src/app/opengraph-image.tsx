import { ImageResponse } from "next/og";

export const alt = "Faztino — AI chatbots that capture leads and book appointments 24/7";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const letterColors = ["#E53238", "#0064D2", "#F5AF02", "#86B817", "#E53238", "#0064D2", "#F5AF02"];

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
        <div
          style={{
            display: "flex",
            fontSize: 220,
            fontWeight: 900,
            fontStyle: "italic",
            letterSpacing: "-0.05em",
            lineHeight: 1,
          }}
        >
          {"faztino".split("").map((char, i) => (
            <span key={i} style={{ color: letterColors[i] }}>
              {char}
            </span>
          ))}
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
