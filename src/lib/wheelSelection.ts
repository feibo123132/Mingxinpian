export const WHEEL_GRADIENT_START_OFFSET = -90;

const normalizeDegrees = (degrees: number) => ((degrees % 360) + 360) % 360;

// Land inside an eligible segment so the pointer agrees with the result.
export const getRestrictedWheelRotation = (
  rotation: number,
  cardCount: number,
  eligibleCount: number,
  random = Math.random(),
) => {
  const count = Math.min(cardCount, eligibleCount);
  if (count <= 0) return rotation;
  const pick = Math.max(0, Math.min(1 - Number.EPSILON, random)) * count;
  const index = Math.floor(pick);
  const position = 0.2 + (pick - index) * 0.6;
  const target = normalizeDegrees(-(index + position) * (360 / cardCount) - WHEEL_GRADIENT_START_OFFSET);
  return rotation + 1800 + normalizeDegrees(target - normalizeDegrees(rotation));
};

export const getWheelSelectedIndex = (finalRotation: number, cardCount: number) => {
  if (cardCount <= 0) return 0;

  const segmentAngle = 360 / cardCount;
  const normalizedAngle = normalizeDegrees(360 - finalRotation - WHEEL_GRADIENT_START_OFFSET);

  return Math.min(cardCount - 1, Math.floor(normalizedAngle / segmentAngle));
};
