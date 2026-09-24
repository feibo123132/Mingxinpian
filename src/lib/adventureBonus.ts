// One independent decision per round: 50% none, 25% for each bonus card.
export const drawAdventureBonus = (random = Math.random()): 0 | 1 | null =>
  random < 0.25 ? 0 : random < 0.5 ? 1 : null;

const BONUS_COOLDOWN_DRAWS = 3;

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
