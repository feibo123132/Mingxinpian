import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const bgmControllerSource = readFileSync(new URL('../src/components/BgmController.tsx', import.meta.url), 'utf8');

test('BGM ducks to 42% of its normal volume while card audio is active', () => {
  assert.match(bgmControllerSource, /const baseVol = 0\.6;/);
  assert.match(bgmControllerSource, /const duckVol = baseVol \* 0\.42;/);
  assert.doesNotMatch(bgmControllerSource, /const duckVol = baseVol \/ 2;/);
  assert.doesNotMatch(bgmControllerSource, /const duckVol = 0\.2;/);
});
