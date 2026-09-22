export const multiplayerSegments = [
  { label: '魔鬼卡', weight: 20, color: '#FF6B6B' },
  { label: '天使卡', weight: 20, color: '#FFD748' },
  { label: '提示卡', weight: 20, color: '#7C90FF' },
  { label: '简单卡', weight: 20, color: '#4ECDC4' },
  { label: '复活卡', weight: 20, color: '#FF9F1C' },
];

export const drawMultiplayer = (count: number, random = Math.random): number[] => {
  if (!Number.isInteger(count) || count < 1) return [];
  // Equally spaced samples preserve each player's marginal weights after shuffling.
  // For 2+ players they cannot all fit into a 20% slice.
  const offset = random();
  const results = Array.from({ length: count }, (_, index) => {
    const point = ((offset + index / count) % 1) * 100;
    let end = 0;
    return multiplayerSegments.findIndex(segment => {
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

export const rotationForResult = (rotation: number, index: number) => {
  const start = multiplayerSegments.slice(0, index).reduce((sum, s) => sum + s.weight, 0);
  const target = (360 - (start + multiplayerSegments[index].weight / 2) * 3.6) % 360;
  return rotation + 1800 + ((target - rotation % 360 + 360) % 360);
};
