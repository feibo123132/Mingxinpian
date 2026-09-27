import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const mainSource = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');

test('development builds unregister stale service workers that can cache broken image responses', () => {
  assert.match(mainSource, /import\.meta\.env\?\.DEV/);
  assert.match(mainSource, /getRegistrations\(\)/);
  assert.match(mainSource, /registration\.unregister\(\)/);
  assert.match(mainSource, /caches\s*\.\s*keys\(\)/);
  assert.match(mainSource, /window\.location\.reload\(\)/);
});

test('production checks imported audio catalogue updates without relying on http cache', () => {
  assert.match(mainSource, /register\([\s\S]*updateViaCache: 'none'/);
});
