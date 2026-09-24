import assert from 'node:assert/strict';
import test from 'node:test';

import { createAvailableMusicPicker, createOptionalCardMusicSelector, optionalCardMusicSlots } from '../src/lib/availableCardMusic.ts';

const tracks = ['first.mp3', 'second.mp3', 'third.mp3'];

test('a card with two available tracks plays each once per cycle', async () => {
  const available = new Set(tracks.slice(0, 2));
  const pick = createAvailableMusicPicker(tracks, async track => available.has(track), () => 0);
  const played = await Promise.all(Array.from({ length: 6 }, () => pick()));

  for (let offset = 0; offset < played.length; offset += 2) {
    assert.deepEqual(played.slice(offset, offset + 2).sort(), tracks.slice(0, 2));
  }
});

test('missing tracks are skipped and newly added tracks join the next cycle', async () => {
  const available = new Set<string>();
  const pick = createAvailableMusicPicker(tracks, async track => available.has(track), () => 0);

  assert.equal(await pick(), null);
  available.add(tracks[0]);
  assert.equal(await pick(), tracks[0]);
  available.add(tracks[1]);
  available.add(tracks[2]);
  assert.deepEqual([await pick(), await pick(), await pick()].sort(), [...tracks]);
});

test('each requested card has three music slots and accepts music1 as the first track', async () => {
  const cardIds = ['adventure-3', 'adventure-4', 'adventure-5', 'relaxed-1', 'relaxed-2'];
  for (const cardId of cardIds) {
    const slots = optionalCardMusicSlots[cardId];
    assert.equal(slots.length, 3);
    const firstAliases = slots[0];
    assert.ok(Array.isArray(firstAliases));
    const numberedFirst = (firstAliases as string[])[1];
    const second = slots[1] as string;
    const pick = createAvailableMusicPicker(slots, async src => src === numberedFirst || src === second, () => 0);
    assert.deepEqual([await pick(), await pick()].sort(), [numberedFirst, second].sort());
  }
});

test('both relaxed cards share one music pool and one cycle', async () => {
  const slots = optionalCardMusicSlots['relaxed-1'];
  assert.equal(optionalCardMusicSlots['relaxed-2'], slots);
  const first = (slots[0] as string[])[0];
  const second = slots[1] as string;
  const available = new Set([first, second]);
  const select = createOptionalCardMusicSelector(async src => available.has(src), () => 0);

  assert.deepEqual(
    [await select('relaxed-1'), await select('relaxed-2')].sort(),
    [first, second].sort(),
  );
  assert.deepEqual(
    [await select('relaxed-2'), await select('relaxed-1')].sort(),
    [first, second].sort(),
  );
});
