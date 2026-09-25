// One independent decision per round: 50% none, 25% for each bonus card.
export const drawAdventureBonus = (random = Math.random()): 0 | 1 | null =>
  random < 0.25 ? 0 : random < 0.5 ? 1 : null;

const BONUS_COOLDOWN_DRAWS = 3;

// 命运十抽每半轮各安排一张轻松卡，间隔仍遵守普通模式的三抽冷却。
export const createFateTenBonusSchedule = (random = Math.random): ReadonlyArray<0 | 1 | null> => {
  const schedule: (0 | 1 | null)[] = Array(11).fill(null);
  const firstDraw = 1 + Math.floor(random() * 5);
  const secondStart = Math.max(6, firstDraw + BONUS_COOLDOWN_DRAWS + 1);
  const secondDraw = secondStart + Math.floor(random() * (11 - secondStart));
  schedule[firstDraw] = random() < 0.5 ? 0 : 1;
  schedule[secondDraw] = random() < 0.5 ? 0 : 1;
  return schedule;
};

// 彩蛋冷却：一旦触发彩蛋，接下来的 3 次抽取必定不出，之后恢复原有概率。
export const createAdventureBonusDrawer = (): ((random?: number) => 0 | 1 | null) => {
  let cooldown = 0;
  return (random = Math.random()): 0 | 1 | null => {
    if (cooldown > 0) {
      cooldown -= 1;
      return null;
    }
    const bonus = drawAdventureBonus(random);
    if (bonus !== null) cooldown = BONUS_COOLDOWN_DRAWS;
    return bonus;
  };
};
