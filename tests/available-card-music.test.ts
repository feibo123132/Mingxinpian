import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';

import { createAvailableMusicPicker, createOptionalCardMusicSelector, createSequentialMusicPicker } from '../src/lib/availableCardMusic.ts';

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

test('sequential discovery stops at the first missing exact filename', async () => {
  const first = '/audio/adventure-card-03-music.mp3';
  const second = '/audio/adventure-card-03-music2.mp3';
  const malformed = '/audio/adventure-card-03-music3❌️.mp3';
  const fourth = '/audio/adventure-card-03-music4.mp3';
  const available = new Set([first, second, malformed, fourth]);
  const checked: string[] = [];
  const pick = createSequentialMusicPicker(
    [first],
    index => `/audio/adventure-card-03-music${index}.mp3`,
    async src => { checked.push(src); return available.has(src); },
    () => 0,
  );

  assert.deepEqual([await pick(), await pick()].sort(), [first, second].sort());
  assert.ok(checked.includes('/audio/adventure-card-03-music3.mp3'));
  assert.ok(!checked.includes(malformed));
  assert.ok(!checked.includes(fourth));

  available.add('/audio/adventure-card-03-music3.mp3');
  assert.deepEqual(
    (await Promise.all(Array.from({ length: 4 }, () => pick()))).sort(),
    [first, second, '/audio/adventure-card-03-music3.mp3', fourth].sort(),
  );
});

test('the installed hint card uses the exact music3 file beside a malformed lookalike', async () => {
  const exact = '/audio/adventure-card-03-music3.mp3';
  const malformed = '/audio/adventure-card-03-music3❌️.mp3';
  assert.ok(existsSync(new URL(`../public${exact}`, import.meta.url)));
  assert.ok(existsSync(new URL(`../public${malformed}`, import.meta.url)));
  const select = createOptionalCardMusicSelector(
    async src => existsSync(new URL(`../public${src}`, import.meta.url)),
    () => 0,
  );
  const played = await Promise.all(Array.from({ length: 3 }, () => select('adventure-3')));
  assert.deepEqual(played.sort(), [
    '/audio/adventure-card-03-music.mp3',
    '/audio/adventure-card-03-music2.mp3',
    exact,
  ].sort());
  assert.ok(!played.includes(malformed));
});

test('all card groups accept their exact music filenames and extend beyond three tracks', async () => {
  const cardPrefixes: Record<string, string> = {
    'adventure-3': 'adventure-card-03',
    'adventure-4': 'adventure-card-04',
    'adventure-5': 'adventure-card-05',
    'relaxed-1': 'relaxed-card',
    'relaxed-2': 'relaxed-card',
    'relaxed-3': 'relaxed-card-03',
    '1': 'card1',
    '5': 'card5',
    'summer-1': 'summer-card-01',
    'summer-10': 'summer-card-10',
  };
  for (const [cardId, prefix] of Object.entries(cardPrefixes)) {
    const first = `/audio/${prefix}-music1.mp3`;
    const second = `/audio/${prefix}-music2.mp3`;
    const third = `/audio/${prefix}-music3.mp3`;
    const fourth = `/audio/${prefix}-music4.mp3`;
    const available = new Set([first, second, third, fourth]);
    const select = createOptionalCardMusicSelector(async src => available.has(src), () => 0);
    const played = await Promise.all(Array.from({ length: 4 }, () => select(cardId)));
    assert.deepEqual(played.sort(), [...available].sort(), cardId);
  }
  const selectUnknown = createOptionalCardMusicSelector(async () => true);
  assert.equal(await selectUnknown('toString'), null);
});

test('both relaxed cards share one music pool and one cycle', async () => {
  const first = '/audio/relaxed-card-music.mp3';
  const second = '/audio/relaxed-card-music2.mp3';
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
