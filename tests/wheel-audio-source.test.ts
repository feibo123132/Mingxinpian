import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const wheelSource = readFileSync(new URL('../src/components/Wheel.tsx', import.meta.url), 'utf8');

test('Wheel plays result audio from the selected card instead of an index-preloaded array', () => {
  assert.match(wheelSource, /playSelectedCardSound\(selectedCard\)/);
  assert.doesNotMatch(wheelSource, /selectionAudiosRef/);
});

test('Wheel does not unlock all result audio files on the first spin', () => {
  assert.doesNotMatch(wheelSource, /audioUnlockedRef/);
  assert.doesNotMatch(wheelSource, /forEach\(\(audio\)/);
});
