/// <reference lib="webworker" />

const CACHE_NAME = "water-billing-v2";
const APP_SHELL = ["/", "/field", "/manifest.json"];
const sw = self as unknown as ServiceWorkerGlobalScope;

function offlineFallback() {
  return new Response("التطبيق غير متاح بدون شبكة قبل فتحه أول مرة.", {
    status: 503,
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}

sw.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  sw.skipWaiting();
});

sw.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  sw.clients.claim();
});

sw.addEventListener("fetch", (event: FetchEvent) => {
  const request = event.request;
  const url = new URL(request.url);

  if (url.pathname.startsWith("/api/pdf")) return;

  if (request.mode === "navigate" || url.pathname === "/field") {
    event.respondWith(
      fetch(request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      }).catch(async () => (await caches.match(request)) ?? (await caches.match("/field")) ?? offlineFallback())
    );
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request).catch(async () => (await caches.match(request)) ?? offlineFallback()));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached ?? fetch(request).then((response) => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      return response;
    }))
  );
});

export {};
