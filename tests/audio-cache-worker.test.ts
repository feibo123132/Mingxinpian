import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
const scope = 'https://example.github.io/Mingxinpian/';
const asset = (name: string, text = 'abcdefghij') => ({
  path: `audio/${name}`, size: Buffer.byteLength(text),
  revision: createHash('sha256').update(text).digest('hex'),
});
const keyOf = (request: string | Request) => typeof request === 'string' ? request : request.url;

class MemoryCache {
  entries = new Map<string, Response>();
  rejectWrites = false;
  async match(request: string | Request) { return this.entries.get(keyOf(request))?.clone(); }
  async put(request: string | Request, response: Response) {
    if (this.rejectWrites) throw new Error('QuotaExceededError');
    assert.equal(response.status, 200, 'partial responses must never enter the cache');
    this.entries.set(keyOf(request), response.clone());
  }
  async keys() { return [...this.entries.keys()].map(url => new Request(url)); }
  async delete(request: string | Request) { return this.entries.delete(keyOf(request)); }
}
class MemoryCaches {
  stores = new Map<string, MemoryCache>();
  async open(name: string) {
    if (!this.stores.has(name)) this.stores.set(name, new MemoryCache());
    return this.stores.get(name)!;
  }
  async match(request: string | Request, options: { cacheName?: string } = {}) {
    if (options.cacheName) return this.stores.get(options.cacheName)?.match(request);
    for (const cache of this.stores.values()) { const result = await cache.match(request); if (result) return result; }
  }
}

function worker(files = [asset('spin.mp3')], caches = new MemoryCaches(), network?: (request: Request) => Promise<Response>) {
  const events = new Map<string, (event: any) => void>();
  const calls: Request[] = [];
  const self = {
    registration: { scope }, AUDIO_MANIFEST: { version: 1, files },
    addEventListener: (name: string, listener: (event: any) => void) => events.set(name, listener),
    skipWaiting: async () => {}, clients: { claim: async () => {} },
  };
  vm.runInNewContext(source, {
    self, caches, Request, Response, Headers, URL, crypto: webcrypto,
    AbortController, setTimeout, clearTimeout,
    importScripts: (path: string) => assert.equal(path, './audio-manifest.js'),
    fetch: async (input: string | Request, options?: RequestInit) => {
      const request = new Request(input, options);
      calls.push(request);
      if (network) return network(request);
      if (request.headers.get('range')) return new Response('ab', { status: 206, headers: { 'content-type': 'audio/mpeg', 'content-range': 'bytes 0-1/10' } });
      return new Response('abcdefghij', { headers: { 'content-type': 'audio/mpeg' } });
    },
  });
  return {
    caches, calls,
    async activate() {
      const waits: Promise<unknown>[] = [];
      events.get('activate')!({ waitUntil: (value: Promise<unknown>) => waits.push(value) });
      await Promise.all(waits);
    },
    async request(path = 'audio/spin.mp3', range?: string) {
      const waits: Promise<unknown>[] = [];
      let response: Promise<Response> | undefined;
      events.get('fetch')!({
        request: new Request(new URL(path, scope), { headers: range ? { range } : {} }),
        waitUntil: (value: Promise<unknown>) => waits.push(value),
        respondWith: (value: Promise<Response>) => { response = value; },
      });
      const result = response ? await response : undefined;
      await Promise.all(waits);
      return result;
    },
    async message(type: string) {
      const messages: any[] = [];
      const waits: Promise<unknown>[] = [];
      events.get('message')!({ data: { type }, ports: [{ postMessage: (message: any) => messages.push(message) }], waitUntil: (value: Promise<unknown>) => waits.push(value) });
      await Promise.all(waits);
      return messages;
    },
  };
}

test('cold Safari range streams immediately and saves one complete verified copy', async () => {
  const w = worker();
  const response = await w.request('audio/spin.mp3', 'bytes=0-1');
  assert.equal(response?.status, 206);
  assert.equal(await response?.text(), 'ab');
  assert.equal(w.calls.filter(request => !request.headers.has('range')).length, 1);
  assert.equal(w.calls.filter(request => request.headers.has('range')).length, 1);
  const status = (await w.message('audio-status')).at(-1);
  assert.equal(status.files[0].saved, true);
});

test('new worker after refresh serves Safari probes, seeking and suffixes without network', async () => {
  const first = worker();
  await first.request();
  const refreshed = worker([asset('spin.mp3')], first.caches, async () => { throw new Error('offline'); });
  await refreshed.activate();
  for (const [range, body, contentRange] of [
    ['bytes=0-1', 'ab', 'bytes 0-1/10'],
    ['bytes=4-', 'efghij', 'bytes 4-9/10'],
    ['bytes=-3', 'hij', 'bytes 7-9/10'],
    ['bytes=8-100', 'ij', 'bytes 8-9/10'],
  ]) {
    const response = await refreshed.request('audio/spin.mp3', range);
    assert.equal(response?.status, 206);
    assert.equal(response?.headers.get('content-range'), contentRange);
    assert.equal(response?.headers.get('content-length'), String(body.length));
    assert.equal(await response?.text(), body);
  }
  const full = await refreshed.request();
  assert.equal(full?.status, 200);
  assert.equal(await full?.text(), 'abcdefghij');
  assert.equal(refreshed.calls.length, 0);
});

test('invalid and unsatisfiable ranges return 416 rather than invalid audio', async () => {
  const w = worker();
  await w.request();
  for (const range of ['bytes=10-', 'bytes=5-2', 'bytes=-0', 'bytes=-', 'bytes=0-1,3-4', 'bytes=99999999999999999999-']) {
    const response = await w.request('audio/spin.mp3', range);
    assert.equal(response?.status, 416, range);
    assert.equal(response?.headers.get('content-range'), 'bytes */10');
  }
});

test('concurrent full requests share a download but get independently readable bodies', async () => {
  const w = worker();
  const responses = await Promise.all([w.request(), w.request(), w.request()]);
  assert.equal(w.calls.length, 1);
  assert.deepEqual(await Promise.all(responses.map(response => response!.text())), ['abcdefghij', 'abcdefghij', 'abcdefghij']);
});

test('deploying changed audio keeps unchanged files and other apps caches', async () => {
  const first = worker([asset('spin.mp3'), asset('bgm1.mp3')]);
  await first.message('audio-save');
  const other = await first.caches.open('another-app');
  await other.put(`${scope}other`, new Response('keep'));
  const updated = worker([asset('spin.mp3'), asset('bgm1.mp3', 'new music')], first.caches,
    async () => new Response('new music', { headers: { 'content-type': 'audio/mpeg' } }));
  await updated.activate();
  const before = (await updated.message('audio-status')).at(-1);
  assert.equal(before.files[0].saved, true);
  assert.equal(before.files[1].saved, false);
  const after = (await updated.message('audio-save')).at(-1);
  assert.equal(after.files.every((file: any) => file.saved), true);
  assert.equal(updated.calls.length, 1);
  assert.ok(await other.match(`${scope}other`));
});

test('deleted names never play stale cached audio and outside-scope requests are untouched', async () => {
  const first = worker();
  await first.request();
  const updated = worker([], first.caches);
  await updated.activate();
  assert.equal(await updated.request(), undefined);
  assert.equal(await updated.request('audio/spin❌️.mp3'), undefined);
  assert.equal(await updated.request('https://example.github.io/AnotherApp/audio/spin.mp3'), undefined);
  assert.equal(updated.calls.length, 0);
});

test('save failure is reported honestly and retry resumes only missing files', async () => {
  let failed = true;
  const w = worker([asset('spin.mp3'), asset('bgm1.mp3')], undefined, async request => {
    if (new URL(request.url).pathname.endsWith('bgm1.mp3') && failed) throw new Error('network failure');
    return new Response('abcdefghij', { headers: { 'content-type': 'audio/mpeg' } });
  });
  const first = (await w.message('audio-save')).at(-1);
  assert.equal(first.failed.length, 1);
  assert.equal(first.files.filter((file: any) => file.saved).length, 1);
  failed = false;
  const retry = (await w.message('audio-save')).at(-1);
  assert.equal(retry.failed.length, 0);
  assert.equal(retry.files.filter((file: any) => file.saved).length, 2);
  assert.equal(w.calls.length, 3);
});

test('quota failures, html fallbacks, truncated or outdated audio are never marked saved', async () => {
  for (const response of [new Response('<html>bad</html>', { headers: { 'content-type': 'text/html' } }),
    new Response('abc', { headers: { 'content-type': 'audio/mpeg' } }),
    new Response('oldoldold!', { headers: { 'content-type': 'audio/mpeg' } }),
    new Response('ab', { status: 206, headers: { 'content-type': 'audio/mpeg' } })]) {
    const w = worker(undefined, undefined, async () => response.clone());
    const status = (await w.message('audio-save')).at(-1);
    assert.equal(status.failed.length, 1);
    assert.equal(status.files[0].saved, false);
  }
  const quota = worker();
  const cache = await quota.caches.open(`postcard-audio-${encodeURIComponent(scope)}`);
  cache.rejectWrites = true;
  const status = (await quota.message('audio-save')).at(-1);
  assert.equal(status.files[0].saved, false);
  assert.match(status.failed[0].reason, /Quota/);
});

test('a valid complete legacy download migrates without downloading again', async () => {
  const caches = new MemoryCaches();
  const legacy = await caches.open('runtime-v2');
  await legacy.put(`${scope}audio/spin.mp3`, new Response('abcdefghij', { headers: { 'content-type': 'audio/mpeg' } }));
  const w = worker(undefined, caches);
  const status = (await w.message('audio-save')).at(-1);
  assert.equal(status.files[0].saved, true);
  assert.equal(w.calls.length, 0);
});
