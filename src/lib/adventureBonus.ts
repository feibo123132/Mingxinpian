// One independent decision per round: 50% none, 25% for each bonus card.
export const drawAdventureBonus = (random = Math.random()): 0 | 1 | null =>
  random < 0.25 ? 0 : random < 0.5 ? 1 : null;
