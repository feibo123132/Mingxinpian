import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';

import { createDevilMusicPicker, devilMusicTracks } from '../src/lib/adventureDevilAudio.ts';

test('devil card plays all four tracks once before reshuffling', async () => {
  const available = new Set(devilMusicTracks);
  const pick = createDevilMusicPicker(() => 0, async src => available.has(src));
  const played = await Promise.all(Array.from({ length: 12 }, () => pick()));

  for (let offset = 0; offset < played.length; offset += 4) {
    assert.deepEqual(played.slice(offset, offset + 4).sort(), [...devilMusicTracks].sort());
  }
});

test('devil card discovers the next exact filename and ignores similar names', async () => {
  const newTrack = '/audio/adventure-devil5-music.mp3';
  const available = new Set([...devilMusicTracks, newTrack, '/audio/adventure-devil6-music❌️.mp3']);
  const pick = createDevilMusicPicker(() => 0, async src => available.has(src));
  const played = await Promise.all(Array.from({ length: 5 }, () => pick()));
  assert.deepEqual(played.sort(), [...devilMusicTracks, newTrack].sort());
});

test('all four devil music files exist', () => {
  for (const track of devilMusicTracks) {
    assert.ok(existsSync(new URL(`../public${track}`, import.meta.url)), `${track} should exist`);
  }
});
