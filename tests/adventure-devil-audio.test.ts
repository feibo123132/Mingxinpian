import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';

import { createDevilMusicPicker, devilMusicTracks } from '../src/lib/adventureDevilAudio.ts';

test('devil card plays all four tracks once before reshuffling', () => {
  const pick = createDevilMusicPicker(() => 0);
  const played = Array.from({ length: 12 }, () => pick());

  for (let offset = 0; offset < played.length; offset += 4) {
    assert.deepEqual(played.slice(offset, offset + 4).sort(), [...devilMusicTracks].sort());
  }
});

test('all four devil music files exist', () => {
  for (const track of devilMusicTracks) {
    assert.ok(existsSync(new URL(`../public${track}`, import.meta.url)), `${track} should exist`);
  }
});
