import assert from 'node:assert/strict';
import test from 'node:test';
import { drawAdventureBonus } from '../src/lib/adventureBonus.ts';

test('half of the random range triggers a bonus, equally split between two cards', () => {
  const counts = [0, 0, 0];
  for (let i = 0; i < 10000; i++) {
    const result = drawAdventureBonus((i + 0.5) / 10000);
    counts[result === null ? 2 : result]++;
  }
  assert.deepEqual(counts, [2500, 2500, 5000]);
});
test('bonus boundaries exclude the normal singing card', () => {
  assert.equal(drawAdventureBonus(0), 0);
  assert.equal(drawAdventureBonus(0.25), 1);
  assert.equal(drawAdventureBonus(0.5), null);
  assert.equal(drawAdventureBonus(0.999999), null);
});
