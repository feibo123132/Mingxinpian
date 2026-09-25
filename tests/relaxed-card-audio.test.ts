import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';

import { createRelaxedCardSoundPicker, selectCardSound } from '../src/lib/relaxedCardAudio.ts';
import { relaxedTheme } from '../src/themes/relaxed.ts';
import { getCardStorageKey, loadCardsForTheme } from '../src/themes/storage.ts';

const sounds = [1, 2, 3].map(number => `/audio/relaxed-card-0${number}.mp3`);

test('both relaxed result cards share a shuffled three-sound cycle', async () => {
  const available = new Set(sounds);
  const pick = createRelaxedCardSoundPicker(() => 0, async src => available.has(src));
  const cards = [relaxedTheme.cards[0], relaxedTheme.cards[1]];
  const played = await Promise.all(Array.from({ length: 9 }, (_, index) =>
    selectCardSound('relaxed', cards[index % cards.length], pick),
  ));

  for (let offset = 0; offset < played.length; offset += 3) {
    assert.deepEqual(played.slice(offset, offset + 3).sort(), sounds);
  }
  assert.equal(await selectCardSound('summer', cards[0], pick), cards[0].sound);
});

test('a fourth relaxed sound joins both cards without selecting a similarly named file', async () => {
  const fourth = '/audio/relaxed-card-04.mp3';
  const available = new Set([...sounds, fourth, '/audio/relaxed-card-05❌️.mp3']);
  const pick = createRelaxedCardSoundPicker(() => 0, async src => available.has(src));
  const played = await Promise.all(Array.from({ length: 4 }, (_, index) =>
    selectCardSound('relaxed', relaxedTheme.cards[index % 2], pick),
  ));
  assert.deepEqual(played.sort(), [...sounds, fourth].sort());
});

test('relaxed result text and all three audio files are available', () => {
  for (const card of relaxedTheme.cards.slice(0, 2)) {
    assert.equal(card.content, '欢迎来到轻松绷住模式');
  }
  for (const sound of sounds) {
    assert.ok(existsSync(new URL(`../public${sound}`, import.meta.url)), `${sound} should exist`);
  }
});

test('previous default result text updates without replacing custom edits', () => {
  const saved = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => saved.get(key) ?? null,
    setItem: (key: string, value: string) => { saved.set(key, value); },
  };
  (globalThis as typeof globalThis & { window: { localStorage: typeof localStorage } }).window = { localStorage };
  saved.set(getCardStorageKey('relaxed'), JSON.stringify(relaxedTheme.cards.map((card, index) => ({
    ...card,
    content: index === 0 ? '直接轻松绷住了' : index === 1
      ? '我们受过严格的训练，无论多好笑呢，我们都不会笑' : '自己写的内容',
  }))));

  const loaded = loadCardsForTheme('relaxed', relaxedTheme.cards);
  assert.equal(loaded[0].content, '欢迎来到轻松绷住模式');
  assert.equal(loaded[1].content, '欢迎来到轻松绷住模式');
  assert.equal(loaded[2].content, '自己写的内容');
});
