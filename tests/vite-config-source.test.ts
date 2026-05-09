import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const viteConfigSource = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8');

test('production build does not inject the Trae Solo badge', () => {
  assert.doesNotMatch(viteConfigSource, /vite-plugin-trae-solo-badge/);
  assert.doesNotMatch(viteConfigSource, /traeBadgePlugin/);
  assert.doesNotMatch(viteConfigSource, /trae\.ai\/solo/);
});
