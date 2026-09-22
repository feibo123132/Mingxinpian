import assert from 'node:assert/strict';
import test from 'node:test';
import { multiplayerSegments, drawMultiplayer, rotationForResult } from '../src/lib/multiplayer.ts';

test('segments match requested percentages', () => {
  assert.deepEqual(multiplayerSegments.map(s => s.weight), [20, 20, 20, 20, 20]);
});
test('every multiplayer round contains different results, including constant random sources', () => {
  for (const count of [2, 3, 5, 10, 20]) {
    for (let i = 0; i < 1000; i++) {
      const results = drawMultiplayer(count, () => i / 1000);
      assert.equal(results.length, count);
      assert.ok(new Set(results).size > 1);
      assert.ok(results.every(r => r >= 0 && r < 5));
    }
  }
});
test('single player preserves the requested distribution', () => {
  const counts = [0, 0, 0, 0, 0];
  for (let i = 0; i < 10000; i++) counts[drawMultiplayer(1, () => (i + .5) / 10000)[0]]++;
  assert.deepEqual(counts, [2000, 2000, 2000, 2000, 2000]);
});
test('successive rotations land inside the selected weighted slice', () => {
  let rotation = 0;
  for (let round = 0; round < 100; round++) {
    for (let index = 0; index < 5; index++) {
      const next = rotationForResult(rotation, index);
      assert.ok(next - rotation >= 1800);
      const angle = ((-next % 360) + 360) % 360;
      const start = multiplayerSegments.slice(0, index).reduce((sum, s) => sum + s.weight * 3.6, 0);
      assert.ok(angle > start && angle < start + multiplayerSegments[index].weight * 3.6);
      rotation = next;
    }
  }
});
