import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const mainSource = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
const serviceWorkerSource = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');

test('development builds unregister stale service workers that can cache broken image responses', () => {
  assert.match(mainSource, /import\.meta\.env\?\.DEV/);
  assert.match(mainSource, /getRegistrations\(\)/);
  assert.match(mainSource, /registration\.unregister\(\)/);
  assert.match(mainSource, /caches\s*\.\s*keys\(\)/);
  assert.match(mainSource, /window\.location\.reload\(\)/);
});

test('service worker only caches real image or audio responses, not html fallbacks', () => {
  assert.match(serviceWorkerSource, /content-type/i);
  assert.match(serviceWorkerSource, /CACHEABLE_RESPONSE_TYPES = \['image\/', 'audio\/'\]/);
  assert.match(serviceWorkerSource, /contentType\.startsWith\(type\)/);
  assert.match(serviceWorkerSource, /cache\.put\(req, res\.clone\(\)\)/);
});
