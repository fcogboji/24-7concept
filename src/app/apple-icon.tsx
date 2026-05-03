import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0064D2",
          color: "#ffffff",
          fontSize: 132,
          fontWeight: 900,
          fontStyle: "italic",
          letterSpacing: "-0.04em",
          lineHeight: 1,
          paddingBottom: 12,
        }}
      >
        f
      </div>
    ),
    { ...size },
  );
}
