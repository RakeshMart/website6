const CACHE_NAME = "rakesh-mart-v2";
const urlsToCache = [
  "/website6/",
  "/website6/index.html",
  "/website6/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache
          .addAll(urlsToCache)
          .catch((err) => console.log("Cache error:", err)),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("script.google.com")) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request)),
    );
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type === "error")
          return response;
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() =>
        caches
          .match(event.request)
          .then((response) => response || new Response("Offline")),
      ),
  );
});

// ====================================================
// PUSH NOTIFICATION HANDLER - RICH WITH IMAGE SUPPORT
// ====================================================
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      title: "Rakesh Mart",
      body: event.data ? event.data.text() : "Koi notification aayi!",
    };
  }

  const title = data.title || "🛒 Rakesh Mart";
  const options = {
    body: data.body || data.message || "Aapke liye kuch khaas!",
    icon: "/website6/icon-192.png",
    badge: "/website6/icon-192.png",
    tag: "rakesh-mart-push",
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200, 100, 200],
    data: { url: data.url || "/website6/", timestamp: Date.now() },
    actions: [
      { action: "open", title: "🛍️ Dekhte Hain" },
      { action: "close", title: "Baad Mein" },
    ],
  };

  // Image support — D column ki URL
  if (data.image && data.image.startsWith("http")) {
    options.image = data.image;
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "close") return;
  const urlToOpen =
    event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : "/website6/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes("website6") && "focus" in client)
            return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(urlToOpen);
      }),
  );
});
