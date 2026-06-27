const CACHE_NAME = "todofuken-pwa-v1";

const getScopeUrl = (path) => new URL(path, self.registration.scope).toString();

const CORE_ASSETS = [
  getScopeUrl("./"),
  getScopeUrl("./index.html"),
  getScopeUrl("./docs/index.html"),
  getScopeUrl("./docs/manifest.webmanifest"),
  getScopeUrl("./docs/icons/icon-192.png"),
  getScopeUrl("./docs/icons/icon-512.png"),
  getScopeUrl("./docs/icons/maskable-192.png"),
  getScopeUrl("./docs/icons/maskable-512.png"),
  getScopeUrl("./docs/icons/apple-touch-icon.png")
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(CORE_ASSETS.map((url) => cache.add(new Request(url, { cache: "reload" }))))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(cacheNames.filter((cacheName) => cacheName !== CACHE_NAME).map((cacheName) => caches.delete(cacheName)))
      )
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (
      (await cache.match(request)) ||
      (await cache.match(getScopeUrl("./docs/index.html"))) ||
      (await cache.match(getScopeUrl("./index.html")))
    );
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin || !requestUrl.href.startsWith(self.registration.scope)) {
    return;
  }

  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});
