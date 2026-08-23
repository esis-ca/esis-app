// ===============================
// ESIS C.A. - Service Worker Avanzado
// ===============================

const CACHE_VERSION = "esis-v3"; 
const STATIC_CACHE = `static-cache-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-cache-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/css/style.css",
  "/js/app.js",
  "/icons/icon-192.png",
  "/icons/icon-256.png",
  "/icons/icon-384.png",
  "/icons/icon-512.png",
  "/icons/maskable-icon-512.png"
];

// ===============================
// INSTALL: Cache inicial
// ===============================
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting(); // fuerza activación inmediata
});

// ===============================
// ACTIVATE: Limpieza de versiones antiguas
// ===============================
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim(); // toma control de todas las pestañas
});

// ===============================
// FETCH: Cache inteligente + actualización automática
// ===============================
self.addEventListener("fetch", event => {
  const request = event.request;

  // Evitar cachear llamadas a APIs futuras (Supabase, D1, etc.)
  if (request.url.includes("/api/")) {
    return event.respondWith(fetch(request));
  }

  event.respondWith(
    caches.match(request).then(cacheResponse => {
      const fetchPromise = fetch(request)
        .then(networkResponse => {
          // Guardar en cache dinámico
          return caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => cacheResponse);

      // Estrategia: "Cache & Update"
      return cacheResponse || fetchPromise;
    })
  );
});

// ===============================
// MENSAJES: Forzar actualización desde la app
// ===============================
self.addEventListener("message", event => {
  if (event.data === "updateSW") {
    self.skipWaiting();
  }
});
