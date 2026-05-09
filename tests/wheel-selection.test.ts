import assert from 'node:assert/strict';
import test from 'node:test';

import { WHEEL_GRADIENT_START_OFFSET, getWheelSelectedIndex } from '../src/lib/wheelSelection.ts';

const normalizeDegrees = (degrees: number) => ((degrees % 360) + 360) % 360;

test('wheel selection matches the visual segment under the pointer', () => {
  const cardCount = 10;
  const targetIndex = 4;
  const segmentAngle = 360 / cardCount;
  const visualMidAngle = (targetIndex + 0.5) * segmentAngle + WHEEL_GRADIENT_START_OFFSET;
  const finalRotation = normalizeDegrees(360 - visualMidAngle);

  assert.equal(getWheelSelectedIndex(finalRotation, cardCount), targetIndex);
});

test('unrotated wheel selects the segment visually centered at the top pointer', () => {
  assert.equal(getWheelSelectedIndex(0, 10), 2);
});
