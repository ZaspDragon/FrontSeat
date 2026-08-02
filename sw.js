const CACHE = 'frontseat-commercial-v4';
const ASSETS = ['./','index.html','styles.css','commercial.css','layout-editor.css','app.js','commercial.js','layout-editor.js','manifest.webmanifest','privacy.html','terms.html'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isCode = /\.(?:js|css|html)$/.test(url.pathname) || event.request.mode === 'navigate';
  if(isCode){
    event.respondWith(fetch(event.request).then(response => {
      const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;
    }).catch(()=>caches.match(event.request).then(cached=>cached||caches.match('./'))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;
  })));
});
