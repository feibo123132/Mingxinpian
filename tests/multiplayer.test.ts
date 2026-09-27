import assert from 'node:assert/strict';
import test from 'node:test';
import { multiplayerSegments, drawMultiplayer, rotationForResult } from '../src/lib/multiplayer.ts';

test('segments match requested percentages', () => {
  assert.deepEqual(multiplayerSegments.map(s => s.weight), [20, 20, 20, 20, 20]);
});

test('four-card adventure draws use four equal slices and matching random landing positions', () => {
  const segments = multiplayerSegments.slice(0, 4).map(segment => ({ ...segment, weight: 25 }));
  const counts = [0, 0, 0, 0];
  for (let sample = 0; sample < 10000; sample++) {
    const result = drawMultiplayer(1, () => (sample + 0.5) / 10000, segments)[0];
    assert.ok(result >= 0 && result < 4);
    counts[result]++;
  }
  assert.deepEqual(counts, [2500, 2500, 2500, 2500]);
  for (const count of [2, 4, 20]) {
    const results = drawMultiplayer(count, () => 0.9, segments);
    assert.ok(results.every(index => index >= 0 && index < 4));
    assert.ok(new Set(results).size > 1);
  }
  let rotation = 0;
  for (let index = 0; index < 4; index++) {
    for (const random of [0, 0.5, 0.999]) {
      const next = rotationForResult(rotation, index, () => random, segments);
      const angle = ((-next % 360) + 360) % 360;
      assert.ok(angle > index * 90 && angle < (index + 1) * 90);
      assert.ok(next - rotation >= 1800);
      rotation = next;
    }
  }
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
      const next = rotationForResult(rotation, index, () => round / 100);
      assert.ok(next - rotation >= 1800);
      const angle = ((-next % 360) + 360) % 360;
      const start = multiplayerSegments.slice(0, index).reduce((sum, s) => sum + s.weight * 3.6, 0);
      assert.ok(angle > start && angle < start + multiplayerSegments[index].weight * 3.6);
      rotation = next;
    }
  }
});

test('a selected segment can stop away from its center', () => {
  for (let index = 0; index < multiplayerSegments.length; index++) {
    const nearStart = ((-rotationForResult(0, index, () => 0) % 360) + 360) % 360;
    const nearEnd = ((-rotationForResult(0, index, () => 0.999) % 360) + 360) % 360;
    const start = multiplayerSegments.slice(0, index).reduce((sum, segment) => sum + segment.weight * 3.6, 0);
    const end = start + multiplayerSegments[index].weight * 3.6;
    assert.ok(nearStart > start && nearStart < end);
    assert.ok(nearEnd > start && nearEnd < end);
    assert.ok(nearEnd - nearStart > (end - start) * 0.7);
  }
});
