import type { AppTheme } from '../themes/types.ts';

export const multiplayerSegments = [
  { label: '魔鬼卡', weight: 20, color: '#FF6B6B' },
  { label: '天使卡', weight: 20, color: '#FFD748' },
  { label: '提示卡', weight: 20, color: '#7C90FF' },
  { label: '连唱卡', weight: 20, color: '#4ECDC4' },
  { label: '复活卡', weight: 20, color: '#FF9F1C' },
];

export const getAdventureSegments = (theme: Pick<AppTheme, 'cards' | 'wheel'>) => theme.cards.map((card, index) => ({
  label: card.title,
  weight: 100 / theme.cards.length,
  color: theme.wheel.colors[index],
}));

export const drawMultiplayer = (count: number, random = Math.random, segments = multiplayerSegments): number[] => {
  if (!Number.isInteger(count) || count < 1 || !segments.length) return [];
  // Equally spaced samples preserve each player's marginal weights after shuffling.
  // For 2+ players they cannot all fit into one of these equal slices.
  const offset = random();
  const results = Array.from({ length: count }, (_, index) => {
    const point = ((offset + index / count) % 1) * 100;
    let end = 0;
    return segments.findIndex(segment => {
      end += segment.weight;
      return point < end;
    });
  });
  for (let i = results.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [results[i], results[j]] = [results[j], results[i]];
  }
  return results;
};

export const rotationForResult = (rotation: number, index: number, random = Math.random, segments = multiplayerSegments) => {
  const start = segments.slice(0, index).reduce((sum, s) => sum + s.weight, 0);
  const width = segments[index].weight * 3.6;
  const landingAngle = start * 3.6 + width * (0.1 + 0.8 * random());
  const target = (360 - landingAngle) % 360;
  return rotation + 1800 + ((target - rotation % 360 + 360) % 360);
};
