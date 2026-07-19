// Intentionally no skipWaiting() / clients.claim(). Those can leave Next.js App Router
// client bundles and RSC payloads out of sync until a hard refresh.
self.addEventListener("install", () => {
  console.log("[SW] Service Worker installed");
});

self.addEventListener("activate", () => {
  console.log("[SW] Service Worker activated");
});

// Handle push notifications
self.addEventListener("push", (event) => {
  console.log("[SW] Push received", event);

  let data = {
    title: "New Lead",
    body: "You have a new lead from your website",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "lead-notification",
    requireInteraction: false,
    data: {
      url: "/dashboard/leads",
    },
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      console.error("[SW] Failed to parse push data", e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      requireInteraction: data.requireInteraction,
      data: data.data,
      vibrate: [200, 100, 200],
    })
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked", event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
