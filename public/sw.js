const CACHE_VERSION = 'v2';
const CACHE_NAME = `fraud-academy-shell-${CACHE_VERSION}`;
const APP_SHELL = ['/', '/manifest.webmanifest', '/icon.svg', '/icon-maskable.svg'];

function offlineFallback() {
  return new Response('', {
    status: 504,
    statusText: 'Offline',
    headers: { 'Cache-Control': 'no-store' },
  });
}

function cachePut(event, request, response) {
  const copy = response.clone();
  const write = caches.open(CACHE_NAME)
    .then((cache) => cache.put(request, copy))
    .catch(() => {});
  try {
    event.waitUntil(write);
  } catch {
    // A storage failure must not turn a successful network response into an error.
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) cachePut(event, '/', response);
          return response;
        })
        .catch(() => caches.match(request)
          .then((cached) => cached || caches.match('/'))
          .then((cached) => cached || offlineFallback())),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const refresh = fetch(request).then((response) => {
        if (response.ok) cachePut(event, request, response);
        return response;
      });

      if (cached) {
        try {
          event.waitUntil(refresh.catch(() => {}));
        } catch {
          refresh.catch(() => {});
        }
        return cached;
      }
      return refresh.catch(() => offlineFallback());
    }),
  );
});
