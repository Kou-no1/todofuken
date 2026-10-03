// Replaced with the current build's files by scripts/build-pwa.mjs.
const CACHE_NAME = "todofuken-pwa-fe5ac155b13dbecc";
const APP_ENTRY = "./docs/index.html";
const PRECACHE_ASSETS = [
  "./",
  "./index.html",
  "./docs/index.html",
  "./docs/assets/index-CYZW2Z7m.js",
  "./docs/assets/index-DmyrvFWs.css",
  "./docs/icons/apple-touch-icon.png",
  "./docs/icons/icon-192.png",
  "./docs/icons/icon-512.png",
  "./docs/icons/maskable-192.png",
  "./docs/icons/maskable-512.png",
  "./docs/manifest.webmanifest"
];
const CACHE_PREFIX = "todofuken-pwa-";
const getScopeUrl = (asset) => new URL(asset, self.registration.scope).href;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Installation must finish caching JS/CSS before this worker can take over.
    await cache.addAll(PRECACHE_ASSETS.map(asset => new Request(getScopeUrl(asset), { cache: "reload" })));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const isNavigation = request.mode === "navigate";
    if (!isNavigation) {
      const cached = await cache.match(request);
      if (cached) return cached;
    }
    try {
      const response = await fetch(request);
      if (response.ok) event.waitUntil(cache.put(request, response.clone()));
      return response;
    } catch (error) {
      const cached = await cache.match(request, { ignoreSearch: isNavigation });
      if (cached) return cached;
      if (isNavigation) {
        const shell = await cache.match(getScopeUrl(APP_ENTRY));
        if (shell) return shell;
      }
      throw error;
    }
  })());
});
