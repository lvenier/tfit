importScripts('./service-worker-version.js', './service-worker-assets.js');
const CACHE_NAME = `${self.APP_VERSION}`;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        await cache.addAll(self.CORE_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(error => {
        console.error('Service worker install failed:', error);
        throw error;
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }

        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(async () => {
        if (event.request.mode === 'navigate') {
          return await caches.match('/') || await caches.match('/index.html');
        }

        return new Response('Offline and not cached', {
          status: 503,
          statusText: 'Offline'
        });
      });
    })
  );
});
