/* Emergency retirement worker for the abandoned FrontSeat v2 service worker. */
self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.filter(function (key) {
        return key.indexOf('frontseat-v2') !== -1;
      }).map(function (key) {
        return caches.delete(key);
      }));
    } catch (error) {
      console.warn('FrontSeat v2 cache cleanup failed', error);
    }

    try {
      await self.registration.unregister();
    } catch (error) {
      console.warn('FrontSeat v2 worker unregister failed', error);
    }

    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      try {
        await client.navigate('./?stable=1');
      } catch (error) {
        client.postMessage({ type: 'FRONTSEAT_V2_RETIRED' });
      }
    }
  })());
});

self.addEventListener('fetch', function (event) {
  event.respondWith(fetch(event.request, { cache: 'no-store' }));
});
