export const WHEEL_GRADIENT_START_OFFSET = -90;

const normalizeDegrees = (degrees: number) => ((degrees % 360) + 360) % 360;

export const getWheelSelectedIndex = (finalRotation: number, cardCount: number) => {
  if (cardCount <= 0) return 0;

  const segmentAngle = 360 / cardCount;
  const normalizedAngle = normalizeDegrees(360 - finalRotation - WHEEL_GRADIENT_START_OFFSET);

  return Math.min(cardCount - 1, Math.floor(normalizedAngle / segmentAngle));
};
