import assert from 'node:assert/strict';
import test from 'node:test';

import { DEFAULT_THEME_ID, builtinThemes, getThemeById } from '../src/themes/index.ts';
import { MAX_POSTCARDS, getCardStorageKey, loadCardsForTheme, saveCardsForTheme } from '../src/themes/storage.ts';

test('registers christmas as the default theme and summer as an alternate theme', () => {
  assert.equal(DEFAULT_THEME_ID, 'christmas');
  assert.ok(builtinThemes.some((theme) => theme.id === 'christmas'));
  assert.ok(builtinThemes.some((theme) => theme.id === 'summer'));
});

test('falls back to the default theme when a saved theme id is unknown', () => {
  assert.equal(getThemeById('missing-theme').id, DEFAULT_THEME_ID);
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
  (globalThis as any).window = { localStorage };

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
    assert.equal(theme.cards.length, 5, `${theme.id} should provide five cards`);
    assert.ok(theme.wheel.colors.length >= theme.cards.length, `${theme.id} needs wheel colors`);
    assert.ok(theme.audio.spin, `${theme.id} needs a spin sound`);
    assert.ok(theme.audio.bgm.length > 0, `${theme.id} needs background music`);
    assert.ok(theme.startButton.label || theme.startButton.image, `${theme.id} needs a start button identity`);
  }
});
