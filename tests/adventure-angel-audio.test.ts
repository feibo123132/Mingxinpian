import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';

import { angelMusicCandidates, createAngelMusicPicker } from '../src/lib/adventureAngelAudio.ts';

test('angel card plays all three music tracks once per shuffled cycle', async () => {
  const available = new Set(angelMusicCandidates);
  const pick = createAngelMusicPicker(() => 0, async src => available.has(src));
  const played = await Promise.all(Array.from({ length: 9 }, () => pick()));

  for (let offset = 0; offset < played.length; offset += 3) {
    assert.deepEqual(played.slice(offset, offset + 3).sort(), [...angelMusicCandidates].sort());
  }
});

test('installed angel tracks are selected without the removed legacy fallback', async () => {
  const available = new Set(angelMusicCandidates);
  const pick = createAngelMusicPicker(() => 0, async src => available.has(src));
  const played = [await pick(), await pick(), await pick()];
  assert.deepEqual(played.sort(), [...angelMusicCandidates].sort());
  for (const track of angelMusicCandidates) {
    assert.ok(existsSync(new URL(`../public${track}`, import.meta.url)));
  }
});

test('new consecutively numbered angel tracks join the next shuffled cycle automatically', async () => {
  const available = new Set([
    ...angelMusicCandidates,
    '/audio/adventure-angel4-music.mp3',
    '/audio/adventure-angel5-music.mp3',
  ]);
  const pick = createAngelMusicPicker(() => 0, async src => available.has(src));
  const firstCycle = await Promise.all(Array.from({ length: 5 }, () => pick()));
  assert.deepEqual(firstCycle.sort(), [...available].sort());

  available.add('/audio/adventure-angel6-music.mp3');
  const secondCycle = await Promise.all(Array.from({ length: 6 }, () => pick()));
  assert.deepEqual(secondCycle.sort(), [...available].sort());
});
