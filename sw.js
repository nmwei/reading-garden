const VERSION = '421d5c561306c1f6';
const SCOPE = new URL(self.registration.scope).pathname;
const PREFIX = `reading-garden:${SCOPE}:`;
const CACHE = PREFIX + VERSION;
const APP = ['index.html', 'app/main.js', 'app/core.js', 'app/audio.js', 'app/offline.js', 'app/pinyin.js', 'app/styles.css', 'data/books.json', 'assets/sources.json', 'assets/icon.svg', 'assets/icon-192.png', 'assets/icon-512.png', 'manifest.webmanifest', 'precache.json'];
const url = path => new URL(path, self.registration.scope).href;
self.addEventListener('install', event => event.waitUntil((async () => {
  await (await caches.open(CACHE)).addAll(APP.map(url));
  // Apply content withdrawals immediately; old caches are removed on activation.
  await self.skipWaiting();
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  const names = await caches.keys();
  await Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== CACHE).map(name => caches.delete(name)));
  await self.clients.claim();
})()));

async function rangeResponse(request, response) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') || '');
  if (!match) return response;
  const bytes = await response.arrayBuffer(), size = bytes.byteLength;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (start >= size || start > end) return new Response(null, {status: 416, headers: {'Content-Range': `bytes */${size}`}});
  return new Response(bytes.slice(start, end + 1), {status: 206, headers: {'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg', 'Content-Length': String(end - start + 1), 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes'}});
}
self.addEventListener('fetch', event => {
  const request = event.request, target = new URL(request.url);
  if (request.method !== 'GET' || target.origin !== location.origin || !target.pathname.startsWith(SCOPE)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (request.mode === 'navigate') {
      try { return await fetch(request); }
      catch { return await cache.match(url('index.html')) || Response.error(); }
    }
    const cached = await cache.match(request, {ignoreSearch: true});
    if (cached) return request.headers.has('range') ? rangeResponse(request, cached) : cached;
    try {
      const response = await fetch(request);
      if (response.ok && response.status === 200) await cache.put(request, response.clone());
      return response;
    } catch { return Response.error(); }
  })());
});
