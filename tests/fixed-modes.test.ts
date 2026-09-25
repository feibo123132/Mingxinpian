import assert from 'node:assert/strict';
import test from 'node:test';
import { drawFixedMode, fixedModes } from '../src/lib/fixedModes.ts';

test('the first fixed mode follows every rule for all ten draws', () => {
  const mode = fixedModes[0];
  for (const random of [0, 0.25, 0.5, 0.75, 0.999]) {
    const results = Array.from({ length: 10 }, (_, index) => drawFixedMode(mode, index + 1, () => random));
    assert.equal(results[0], 4);
    assert.equal(results[4], 4);
    for (const drawNumber of [3, 6, 10]) assert.equal(results[drawNumber - 1], 0);
    for (const drawNumber of [2, 4, 7, 8, 9]) {
      assert.ok(results[drawNumber - 1] !== 0);
      assert.ok(results[drawNumber - 1] !== null);
    }
  }
});

test('a fixed round ends after ten draws', () => {
  const mode = fixedModes[0];
  assert.equal(drawFixedMode(mode, 0), null);
  assert.equal(drawFixedMode(mode, 11), null);
  assert.equal(drawFixedMode(mode, 1.5), null);
});
