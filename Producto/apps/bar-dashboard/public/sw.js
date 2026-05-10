// Service Worker — Bar Dashboard
// Estrategia: Cache-First para assets, Network-First para datos de órdenes
// En modo offline muestra los últimos datos cacheados con banner de advertencia.

const CACHE_NAME = 'bar-kds-v1';
const ASSETS_TO_CACHE = ['/', '/login'];

// Instalar: cachear assets principales
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activar: limpiar caches viejos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: Network-First con fallback a cache
self.addEventListener('fetch', (e) => {
  const { request } = e;

  // Solo interceptar GET del mismo origen
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return;

  // Para archivos estáticos (_next/static) — Cache-First
  if (request.url.includes('/_next/static/')) {
    e.respondWith(
      caches.match(request).then((cached) =>
        cached ?? fetch(request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return res;
        })
      )
    );
    return;
  }

  // Para páginas — Network-First con fallback
  e.respondWith(
    fetch(request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        return res;
      })
      .catch(() => caches.match(request).then((cached) => cached ?? Response.error()))
  );
});

// Mensaje desde el cliente para forzar actualización
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
