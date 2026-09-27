importScripts('./audio-manifest.js');

// Stable, scoped caches survive app updates without touching other GitHub Pages apps.
const scope = self.registration.scope;
const AUDIO_CACHE = `postcard-audio-${encodeURIComponent(scope)}`;
const IMAGE_CACHE = `postcard-images-${encodeURIComponent(scope)}`;
const assets = new Map(self.AUDIO_MANIFEST.files.map(file => [new URL(file.path, scope).href, file]));
const downloads = new Map();

const cacheKey = (url, file) => {
  const key = new URL(url);
  key.searchParams.set('__audio_revision', file.revision);
  return key.href;
};
const findAudio = async (url, file) => {
  const cache = await caches.open(AUDIO_CACHE);
  return cache.match(cacheKey(url, file));
};
const digest = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
  .map(byte => byte.toString(16).padStart(2, '0')).join('');

const ensureAudio = (url, file) => {
  const key = cacheKey(url, file);
  if (downloads.has(key)) return downloads.get(key);
  const task = (async () => {
    const cache = await caches.open(AUDIO_CACHE);
    const cached = await cache.match(key);
    if (cached) return cached;

    // Reuse complete v2 downloads only after verifying they match this deployment.
    const legacy = await caches.match(url, { cacheName: 'runtime-v2' });
    if (legacy?.status === 200 && (legacy.headers.get('content-type') || '').startsWith('audio/')) {
      const bytes = await legacy.arrayBuffer();
      if (bytes.byteLength === file.size && await digest(bytes) === file.revision) {
        const response = new Response(bytes, { headers: legacy.headers });
        await cache.put(key, response.clone());
        return response;
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300000);
    try {
      // No Range header: Cache Storage needs the complete 200 response.
      const response = await fetch(key, { cache: 'no-cache', signal: controller.signal });
      if (response.status !== 200 || !(response.headers.get('content-type') || '').startsWith('audio/')) {
        throw new Error('音频下载失败');
      }
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength !== file.size || await digest(bytes) !== file.revision) {
        throw new Error('音频尚未下载完整，或网站正在更新，请稍后重试');
      }
      const headers = new Headers(response.headers);
      headers.delete('content-encoding');
      headers.delete('content-range');
      headers.set('content-length', String(bytes.byteLength));
      headers.set('accept-ranges', 'bytes');
      const full = new Response(bytes, { status: 200, headers });
      // A quota/write failure is reported, never counted as a successful save.
      await cache.put(key, full.clone());
      return full;
    } finally {
      clearTimeout(timeout);
    }
  })();
  downloads.set(key, task);
  void task.finally(() => downloads.delete(key)).catch(() => {});
  return task;
};

const rangedResponse = async (response, range) => {
  if (!range) return response;
  const bytes = await response.arrayBuffer();
  const length = bytes.byteLength;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  let start;
  let end;
  if (match && (match[1] || match[2])) {
    if (!match[1]) {
      const suffix = Number(match[2]);
      start = Math.max(0, length - suffix);
      end = length - 1;
      if (suffix === 0) start = length;
    } else {
      start = Number(match[1]);
      end = match[2] ? Math.min(Number(match[2]), length - 1) : length - 1;
    }
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= length || start > end) {
    return new Response(null, { status: 416, headers: { 'content-range': `bytes */${length}` } });
  }
  const headers = new Headers(response.headers);
  headers.set('content-range', `bytes ${start}-${end}/${length}`);
  headers.set('content-length', String(end - start + 1));
  headers.set('accept-ranges', 'bytes');
  return new Response(bytes.slice(start, end + 1), { status: 206, headers });
};

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(AUDIO_CACHE);
    const currentKeys = new Set(Array.from(assets, ([url, file]) => cacheKey(url, file)));
    // Remove only replaced/deleted audio belonging to this app, keep unchanged files.
    for (const request of await cache.keys()) {
      if (!currentKeys.has(request.url)) await cache.delete(request);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== new URL(scope).origin || !url.href.startsWith(scope)) return;
  const canonical = new URL(url);
  canonical.search = '';
  const file = assets.get(canonical.href);
  if (file) {
    const range = request.headers.get('range');
    // Extend the worker lifetime until the whole file has been saved.
    event.waitUntil(ensureAudio(canonical.href, file).catch(() => {}));
    event.respondWith((async () => {
      const cached = await findAudio(canonical.href, file);
      if (cached) return rangedResponse(cached, range);
      // Keep first-time Safari playback streamable while saving a complete copy.
      if (range) return fetch(request);
      try { return (await ensureAudio(canonical.href, file)).clone(); }
      catch { return fetch(request); }
    })());
    return;
  }
  if (url.pathname.includes('/audio/')) return; // Never serve a deleted/disabled name from an old cache.
  if (request.destination !== 'image' && !/\.(png|jpe?g|gif|webp|svg)$/i.test(url.pathname)) return;
  const response = (async () => {
    const cache = await caches.open(IMAGE_CACHE);
    const cached = await cache.match(request) || await caches.match(request, { cacheName: 'runtime-v2' });
    if (cached?.status === 200 && (cached.headers.get('content-type') || '').startsWith('image/')) return cached;
    const result = await fetch(request);
    if (result.status === 200 && (result.headers.get('content-type') || '').startsWith('image/')) {
      // Clone before handing the response body to the browser.
      try { await cache.put(request, result.clone()); } catch { /* Playback/rendering still works. */ }
    }
    return result;
  })();
  event.respondWith(response);
  event.waitUntil(response.then(() => undefined).catch(() => {}));
});

const cacheStatus = async () => {
  const files = await Promise.all(Array.from(assets, async ([url, file]) => ({
    ...file, saved: Boolean(await findAudio(url, file)),
  })));
  return { scope, files };
};

self.addEventListener('message', event => {
  const port = event.ports?.[0];
  if (!port || !['audio-status', 'audio-save'].includes(event.data?.type)) return;
  event.waitUntil((async () => {
    try {
      if (event.data.type === 'audio-save') {
        const failed = [];
        for (const [url, file] of assets) {
          port.postMessage({ type: 'progress', ...await cacheStatus(), failed, currentFile: file.path });
          try { await ensureAudio(url, file); }
          catch (error) { failed.push({ path: file.path, reason: error.message || '保存失败' }); }
          port.postMessage({ type: 'progress', ...await cacheStatus(), failed });
        }
        port.postMessage({ type: 'done', ...await cacheStatus(), failed });
      } else {
        port.postMessage({ type: 'done', ...await cacheStatus(), failed: [] });
      }
    } catch (error) {
      port.postMessage({ type: 'error', error: error.message || '本机存储暂时不可用' });
    }
  })());
});
