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

// ===================================================
// NATIVE WEB PUSH NOTIFICATION HANDLER
// Spin + Offer + General + Manual
// SINGLE push handler (duplicate listeners removed — was
// causing double/conflicting notifications).
// Works through Service Worker even when page is closed.
// ===================================================

self.addEventListener("push", function (event) {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      title: "🛒 Rakesh Mart",
      body: event.data ? event.data.text() : "Koi notification aayi!"
    };
  }

  const title = data.title || "🛒 Rakesh Mart";

  const options = {
    body: data.body || data.message || "Aapke liye kuch khaas!",
    icon: "/website6/icon-192.png",
    badge: "/website6/icon-192.png",

    // Har scheduled/manual notification ki apni unique tag (notificationId
    // backend se aati hai) — isse duplicate/overwrite issues nahi hote aur
    // renotify:true rehne se agar kabhi tag same ho to bhi user ko dikhta hai.
    tag: data.notificationId || `rakesh-mart-${Date.now()}`,
    renotify: true,

    requireInteraction: false,
    vibrate: [200, 100, 200, 100, 200],

    data: {
      url: data.url || "/website6/",
      type: data.type || "general",
      notificationId: data.notificationId || ""
    },

    actions: [
      { action: "open", title: "🛍️ Dekhte Hain" },
      { action: "close", title: "Baad Mein" },
    ],
  };

  // Notification image (Spin/Offer/Scheduled banner ya manual image)
  if (
    data.image &&
    typeof data.image === "string" &&
    data.image.startsWith("http")
  ) {
    options.image = data.image;
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});


// ===================================================
// NOTIFICATION CLICK — SINGLE reliable handler
// ===================================================

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  // "Baad Mein" action → sirf close karo, kuch aur mat karo
  if (event.action === "close") return;

  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || "/website6/";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true
      })
      .then(function (clientList) {

        // Existing website/PWA window mil jaye to usi ko focus + navigate karo
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes("website6") && "focus" in client) {
            return client.focus().then(function () {
              if ("navigate" in client) {
                return client.navigate(targetUrl);
              }
            });
          }
        }

        // Koi window open nahi hai → naya window kholo
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
