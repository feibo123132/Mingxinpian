import assert from 'node:assert/strict';
import test from 'node:test';
import { createFateTenDrawSequence, createFateTenRevivalDraws, drawFixedMode, fixedModes } from '../src/lib/fixedModes.ts';

test('the first fixed mode follows every rule for all ten draws', () => {
  assert.deepEqual(createFateTenRevivalDraws(() => 0), [1, 5]);
  assert.deepEqual(createFateTenRevivalDraws(() => 0.999), [3, 7]);
  for (let seed = 0; seed < 1000; seed++) {
    let state = seed;
    const random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 0x100000000);
    const results = createFateTenDrawSequence(random);
    const revivalDraws = results.flatMap((result, index) => result === 4 ? [index + 1] : []);
    assert.equal(results.length, 10);
    assert.ok(revivalDraws[0] >= 1 && revivalDraws[0] <= 3);
    assert.ok(revivalDraws[1] >= 5 && revivalDraws[1] <= 7);
    assert.deepEqual(results.flatMap((result, index) => result === 0 ? [index + 1] : []), [4, 8]);
    assert.equal(revivalDraws.length, 2);
    for (const card of [1, 2, 3]) assert.ok(results.includes(card));
    for (const drawNumber of [1, 2, 3, 5, 6, 7, 9, 10]) {
      if (!revivalDraws.includes(drawNumber)) assert.ok([1, 2, 3].includes(results[drawNumber - 1] ?? -1));
    }
  }
});

test('a fixed round ends after ten draws', () => {
  const mode = fixedModes[0];
  assert.equal(drawFixedMode(mode, 0), null);
  assert.equal(drawFixedMode(mode, 11), null);
  assert.equal(drawFixedMode(mode, 1.5), null);
});
