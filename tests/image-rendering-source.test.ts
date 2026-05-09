import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const wheelSource = readFileSync(new URL('../src/components/Wheel.tsx', import.meta.url), 'utf8');
const modalSource = readFileSync(new URL('../src/components/ResultModal.tsx', import.meta.url), 'utf8');

test('summer start button artwork is contained instead of cropped', () => {
  assert.match(wheelSource, /object-contain/);
});

test('result modal reserves a landscape postcard frame for card images', () => {
  assert.match(modalSource, /aspect-\[4\/3\]/);
  assert.doesNotMatch(modalSource, /h-60 w-60 rounded-xl object-cover/);
});
