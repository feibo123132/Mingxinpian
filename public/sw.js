const VERSION = 'v2';
const RUNTIME_CACHE = `runtime-${VERSION}`;
const CACHEABLE_RESPONSE_TYPES = ['image/', 'audio/'];

const isCacheableAssetResponse = (res) => {
  const contentType = res.headers.get('content-type') || '';

  return res.status === 200 && res.type === 'basic' && CACHEABLE_RESPONSE_TYPES.some((type) => contentType.startsWith(type));
};

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => ![RUNTIME_CACHE].includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  const isImage = req.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i);
  const isAudio = req.destination === 'audio' || url.pathname.includes('/audio/');
  if (req.method !== 'GET') return;
  if (!(isImage || isAudio)) return;
  event.respondWith(
    caches.open(RUNTIME_CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      if (cached && isCacheableAssetResponse(cached)) return cached;
      if (cached) {
        try { await cache.delete(req); } catch {}
      }
      try {
        const res = await fetch(req);
        if (isCacheableAssetResponse(res)) {
          try { await cache.put(req, res.clone()); } catch {}
        }
        return res;
      } catch {
        return cached || Response.error();
      }
    })
  );
});
