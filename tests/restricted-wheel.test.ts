import assert from 'node:assert/strict';
import test from 'node:test';
import { getWheelSelectedIndex, getRestrictedWheelRotation } from '../src/lib/wheelSelection.ts';

test('restricted spins always land on one of the first two visible segments', () => {
  let rotation = 0;
  const seen = new Set<number>();
  for (let i = 0; i < 1000; i++) {
    const next = getRestrictedWheelRotation(rotation, 3, 2, i / 1000);
    const index = getWheelSelectedIndex(next, 3);
    assert.ok(index === 0 || index === 1);
    assert.ok(next - rotation >= 1800);
    seen.add(index);
    rotation = next;
  }
  assert.deepEqual([...seen].sort(), [0, 1]);
});
