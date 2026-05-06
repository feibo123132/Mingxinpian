import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const modalSource = readFileSync(new URL('../src/components/SettingsModal.tsx', import.meta.url), 'utf8');

test('App passes up to ten cards to the wheel and editor', () => {
  assert.match(appSource, /MAX_POSTCARDS/);
  assert.doesNotMatch(appSource, /slice\(0, 5\)/);
});

test('Settings modal can add and delete postcards up to the shared limit', () => {
  assert.match(modalSource, /MAX_POSTCARDS/);
  assert.match(modalSource, /MIN_POSTCARDS/);
  assert.match(modalSource, /增加明信片/);
  assert.match(modalSource, /删除/);
  assert.match(modalSource, /const addCard/);
  assert.match(modalSource, /const deleteCard/);
});
