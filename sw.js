const VERSION = '38f316f12e58906d';
const SCOPE = new URL(self.registration.scope).pathname;
const PREFIX = `reading-garden:${SCOPE}:`;
const CACHE = PREFIX + VERSION;
const LOCAL_PREVIEW = ['localhost', '127.0.0.1', '[::1]'].includes(new URL(self.registration.scope).hostname) && new URL(self.location.href).searchParams.get('mode') !== 'offline';
const APP = ['index.html', 'app/main.js', 'app/core.js', 'app/reading-levels.js', 'app/audio.js', 'app/offline.js', 'app/library.js', 'app/pinyin.js', 'app/parent-gate.js', 'app/styles.css', 'data/books.json', 'assets/sources.json', 'assets/icon.svg', 'assets/icon-192.png', 'assets/icon-512.png', 'manifest.webmanifest'];
const url = path => new URL(path, self.registration.scope).href;
self.addEventListener('install', event => {
  let createdCache = false;
  event.waitUntil((async () => {
  const response = await fetch(url('precache.json'), {cache: 'reload'});
  if (!response.ok) throw Error('Missing offline manifest.');
  const info = await response.clone().json();
  if (info.version !== VERSION) throw Error('The site changed while installing.');
  createdCache = !(await caches.keys()).includes(CACHE);
  const cache = await caches.open(CACHE);
  await cache.put(url('precache.json'), response);
  // Migrate only still-published, byte-verified media. This also works for old
  // caches whose manifests did not yet include hashes, and drops withdrawn files.
  const oldNames = (await caches.keys()).filter(name => name.startsWith(PREFIX) && /^[a-f0-9]{16}$/.test(name.slice(PREFIX.length)) && name !== CACHE);
  for (const name of oldNames) {
    const previous = await caches.open(name), requests = await previous.keys();
    let next = 0;
    await Promise.all(Array.from({length: 4}, async () => {
      while (next < requests.length) {
        const request = requests[next++], path = new URL(request.url).pathname.slice(SCOPE.length);
        const expected = info.assets?.[path];
        if (!expected || await cache.match(request)) continue;
        const saved = await previous.match(request);
        if (!saved || saved.status !== 200) continue;
        const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await saved.clone().arrayBuffer())), byte => byte.toString(16).padStart(2, '0')).join('');
        if (hash === expected) await cache.put(request, saved);
      }
    }));
  }
  await cache.addAll(APP.map(path => new Request(url(path), {cache: 'reload'})));
  // Covers are small and make the complete shelf useful even when only one book
  // has been downloaded. Reused covers never hit the network again.
  const covers = Object.values(info.books || {}).map(book => book.cover);
  for (let i = 0; i < covers.length; i += 4) await Promise.all(covers.slice(i, i + 4).map(async cover => {
    if (!await cache.match(url(cover))) await cache.add(new Request(url(cover), {cache: 'reload'}));
  }));
  // Production updates wait for the parent's explicit reload; local preview stays quick.
  if (LOCAL_PREVIEW) await self.skipWaiting();
  })().catch(async error => {
    // A failed update must not leave a large, half-created copy occupying space.
    // Never delete a cache that already existed when this install started.
    if (createdCache) await caches.delete(CACHE);
    throw error;
  }));
});
self.addEventListener('message', event => {
  if (event.data?.type === 'APPLY_UPDATE') event.waitUntil(self.skipWaiting());
});
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
    // Explicit repair/update requests must reach the network, including failures.
    // Falling back to cache here would report stale or damaged resources as fresh.
    if (request.cache === 'reload' || request.cache === 'no-store') return fetch(request);
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
