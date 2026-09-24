import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';

import { angelMusicCandidates, createAngelMusicPicker } from '../src/lib/adventureAngelAudio.ts';

test('angel card plays all three music tracks once per shuffled cycle', async () => {
  const pick = createAngelMusicPicker(() => 0);
  const played = await Promise.all(Array.from({ length: 9 }, () => pick()));

  for (let offset = 0; offset < played.length; offset += 3) {
    assert.deepEqual(played.slice(offset, offset + 3).sort(), [...angelMusicCandidates].sort());
  }
});

test('installed angel tracks are selected without the removed legacy fallback', async () => {
  const pick = createAngelMusicPicker(() => 0);
  const played = [await pick(), await pick(), await pick()];
  assert.deepEqual(played.sort(), [...angelMusicCandidates].sort());
  for (const track of angelMusicCandidates) {
    assert.ok(existsSync(new URL(`../public${track}`, import.meta.url)));
  }
});
