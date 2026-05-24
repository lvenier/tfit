const CACHE_NAME = 'box4fit-v1.11.3';
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './js/game-utils.js',
  './js/game-config.js',
  './js/game-state.js',
  './js/vars.js',
  './js/game-assets.js',
  './js/game-calibration.js',
  './js/game-input.js',
  './js/game-logic.js',
  './js/game-round.js',
  './js/game-render.js',
  './js/game-score.js',
  './js/game-flow.js',
  './js/app-input-actions.js',
  './js/camera-runtime.js',
  './js/pose-detection.js',
  './js/fight-mode.js',
  './js/pad-mode.js',
  './js/shadow-mode.js',
  './js/app.js',
  './js/p5js/p5.js',
  './js/p5js/p5.sound.js',
  './js/ml5js/ml5.min.js',
  './js/ml5js/model.json',
  './js/ml5js/group1-shard1of3.bin',
  './js/ml5js/group1-shard2of3.bin',
  './js/ml5js/group1-shard3of3.bin',
  './assets/logos/logo.256.png',
  './assets/logos/logo.512.rounded.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
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
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        return response;
      });
    })
  );
});
