import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: "50%",
          color: "#ffffff",
          fontSize: 24,
          fontWeight: 900,
          fontStyle: "italic",
          letterSpacing: "-0.04em",
          lineHeight: 1,
          paddingBottom: 2,
        }}
      >
        f
      </div>
    ),
    { ...size },
  );
}
