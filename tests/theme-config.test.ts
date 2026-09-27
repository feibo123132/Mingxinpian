import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';

import { DEFAULT_THEME_ID, builtinThemes, getThemeById, isAdventureTheme } from '../src/themes/index.ts';
import { getAdventureSegments } from '../src/lib/multiplayer.ts';
import { MAX_POSTCARDS, getCardStorageKey, loadCardsForTheme, saveCardsForTheme } from '../src/themes/storage.ts';

const setMockLocalStorage = (localStorage: { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void }) => {
  (globalThis as typeof globalThis & { window: { localStorage: typeof localStorage } }).window = { localStorage };
};

test('registers christmas as the default theme and summer as an alternate theme', () => {
  assert.equal(DEFAULT_THEME_ID, 'christmas');
  assert.ok(builtinThemes.some((theme) => theme.id === 'christmas'));
  assert.ok(builtinThemes.some((theme) => theme.id === 'summer'));
});

test('falls back to the default theme when a saved theme id is unknown', () => {
  assert.equal(getThemeById('missing-theme').id, DEFAULT_THEME_ID);
});

test('adventure II keeps the original presentation with its own four-card set', () => {
  const original = getThemeById('adventure');
  const second = getThemeById('adventure-2');
  assert.equal(second.name, '勇者大闯关②');
  assert.ok(isAdventureTheme(second.id));
  assert.equal(second.title, '勇者大闯关②');
  assert.deepEqual(second.cards.map(card => card.title), ['魔鬼卡', '天使卡', '提示卡', '连唱卡']);
  assert.deepEqual(second.cards.slice(0, 3), original.cards.slice(0, 3));
  assert.deepEqual(second.wheel.colors, original.wheel.colors.slice(0, 4));
  assert.deepEqual(getAdventureSegments(second).map(segment => segment.weight), [25, 25, 25, 25]);
  assert.deepEqual(getAdventureSegments(original).map(segment => segment.weight), [20, 20, 20, 20, 20]);
  assert.equal(second.background, original.background);
  assert.equal(second.titleColor, original.titleColor);
  assert.equal(second.surface, original.surface);
  assert.deepEqual(second.audio, original.audio);
  assert.notEqual(getCardStorageKey(second.id), getCardStorageKey(original.id));
  assert.equal(second.cards[3].image, '/images/adventure-card-06.png');
  assert.equal(second.cards[3].sound, '/audio/adventure-card-06.mp3');
  assert.ok(existsSync(new URL(`../public${second.cards[3].fallbackImage}`, import.meta.url)));
});

test('summer theme uses its dedicated three-track background music set', () => {
  const summerTheme = getThemeById('summer');

  assert.deepEqual(summerTheme.audio.bgm, [
    '/audio/summer-bgm1.mp3',
    '/audio/summer-bgm2.mp3',
    '/audio/summer-bgm3.mp3',
  ]);
});

test('summer theme uses the Jieyou wind-facing header copy', () => {
  const summerTheme = getThemeById('summer');

  assert.equal(summerTheme.icon, '🌊');
  assert.equal(summerTheme.title, '风吹一夏');
  assert.equal(summerTheme.subtitle, '点击JIEYOU按钮，抽取你的夏日明信片');
  assert.equal(summerTheme.startButton.ariaLabel, '点击JIEYOU按钮开始抽卡');
});

test('summer theme uses the self-love footer copy', () => {
  const summerTheme = getThemeById('summer');

  assert.equal(summerTheme.footer, '爱自己，是终身美丽的开始');
});

test('summer postcard image and sound assets stay aligned with card order', () => {
  const summerTheme = getThemeById('summer');

  summerTheme.cards.forEach((card, index) => {
    const cardNumber = String(index + 1).padStart(2, '0');

    assert.equal(card.image, `/images/themes/summer/card-${cardNumber}.png`);
    assert.equal(card.sound, `/audio/summer-card-${cardNumber}.mp3`);
  });
  assert.equal(summerTheme.cards[4]?.title, '吃点好的');
});

test('summer postcard image and logo files exist in public assets', () => {
  const summerTheme = getThemeById('summer');
  const publicRoot = new URL('../public/', import.meta.url);

  assert.ok(existsSync(new URL('images/themes/summer/start-button.png', publicRoot)));
  for (const card of summerTheme.cards) {
    assert.ok(existsSync(new URL(card.image.replace(/^\//, ''), publicRoot)), `${card.image} should exist`);
  }
});

test('summer saved cards fall back from stale local image paths to theme assets', () => {
  const summerTheme = getThemeById('summer');
  const saved = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => saved.get(key) ?? null,
    setItem: (key: string, value: string) => saved.set(key, value),
  };
  setMockLocalStorage(localStorage);

  const savedCards = summerTheme.cards.map((card, index) => ({
    ...card,
    image: index === 4 ? 'D:\\broken\\card-05.png' : card.image,
  }));
  saved.set(getCardStorageKey('summer'), JSON.stringify(savedCards));

  const loaded = loadCardsForTheme('summer', summerTheme.cards);

  assert.equal(loaded[4].title, '吃点好的');
  assert.equal(loaded[4].image, '/images/themes/summer/card-05.png');
});

test('summer saved cards fall back from stale local sounds to the card-order sound', () => {
  const summerTheme = getThemeById('summer');
  const saved = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => saved.get(key) ?? null,
    setItem: (key: string, value: string) => saved.set(key, value),
  };
  setMockLocalStorage(localStorage);

  const savedCards = summerTheme.cards.map((card, index) => ({
    ...card,
    sound: index === 8 ? '/audio/summer-card-01.mp3' : card.sound,
  }));
  saved.set(getCardStorageKey('summer'), JSON.stringify(savedCards));

  const loaded = loadCardsForTheme('summer', summerTheme.cards);

  assert.equal(loaded[8].title, '热爱生活');
  assert.equal(loaded[8].sound, '/audio/summer-card-09.mp3');
});

test('adventure cards use images even when old saved settings contain video paths', () => {
  const adventureTheme = getThemeById('adventure');
  const saved = new Map<string, string>();
  setMockLocalStorage({
    getItem: key => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, value),
  });
  saved.set(getCardStorageKey('adventure'), JSON.stringify(adventureTheme.cards.map((card, index) => ({
    ...card,
    video: `/videos/adventure-card-${String(index + 1).padStart(2, '0')}.mp4`,
  }))));

  const loaded = loadCardsForTheme('adventure', adventureTheme.cards);
  loaded.forEach((card, index) => {
    assert.equal(card.video, undefined);
    assert.equal(card.image, `/images/adventure-card-${String(index + 1).padStart(2, '0')}.png`);
  });
  assert.ok(adventureTheme.cards.every(card => !card.video));
});

test('keeps edited postcard data isolated per theme', () => {
  assert.equal(getCardStorageKey('christmas'), 'postcard-config:christmas');
  assert.equal(getCardStorageKey('summer'), 'postcard-config:summer');
});

test('card storage supports up to ten postcards per theme', () => {
  const saved = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => saved.get(key) ?? null,
    setItem: (key: string, value: string) => saved.set(key, value),
  };
  setMockLocalStorage(localStorage);

  const fallback = builtinThemes[0].cards;
  const cards = Array.from({ length: 12 }, (_, index) => ({
    ...fallback[index % fallback.length],
    id: `saved-${index + 1}`,
    title: `Saved ${index + 1}`,
  }));

  saveCardsForTheme('summer', cards);

  const raw = saved.get(getCardStorageKey('summer'));
  assert.ok(raw);
  assert.equal(JSON.parse(raw).length, MAX_POSTCARDS);
  assert.equal(loadCardsForTheme('summer', fallback).length, MAX_POSTCARDS);
});

test('each built-in theme is complete enough to drive the wheel UI', () => {
  for (const theme of builtinThemes) {
    assert.ok(theme.cards.length > 0, `${theme.id} should provide at least one card`);
    assert.ok(theme.cards.length <= MAX_POSTCARDS, `${theme.id} should not exceed the card limit`);
    assert.ok(theme.wheel.colors.length >= theme.cards.length, `${theme.id} needs wheel colors`);
    assert.ok(theme.audio.spin, `${theme.id} needs a spin sound`);
    assert.ok(theme.audio.bgm.length > 0, `${theme.id} needs background music`);
    assert.ok(theme.startButton.label || theme.startButton.image, `${theme.id} needs a start button identity`);
  }
});
