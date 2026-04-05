// Intentionally no skipWaiting() / clients.claim(). Those can leave Next.js App Router
// client bundles and RSC payloads out of sync until a hard refresh.
self.addEventListener("install", () => {});

self.addEventListener("activate", () => {});
