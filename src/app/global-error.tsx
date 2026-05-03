"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[app/global-error]", error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fafaf9",
            color: "#1c1917",
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
            padding: "1.5rem",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Something broke</h1>
          <p style={{ marginTop: "0.5rem", maxWidth: "28rem", color: "#57534e" }}>
            The page failed to render. Please refresh and try again. If the problem persists, contact support.
          </p>
          {error.digest && (
            <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#a8a29e" }}>
              Reference: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={() => unstable_retry()}
            style={{
              marginTop: "2rem",
              minHeight: "48px",
              padding: "0.75rem 1.5rem",
              borderRadius: "9999px",
              backgroundColor: "#1c1917",
              color: "white",
              fontWeight: 600,
              fontSize: "0.875rem",
              border: "none",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
