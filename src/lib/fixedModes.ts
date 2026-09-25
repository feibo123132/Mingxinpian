import { multiplayerSegments } from './multiplayer.ts';

interface FixedModeBase {
  id: string;
  name: string;
  description: string;
  icon: string;
  themeId: 'adventure' | 'relaxed';
}

export interface SequenceFixedMode extends FixedModeBase {
  kind: 'sequence';
  totalDraws: number;
  forcedResults: Readonly<Record<number, number>>;
  excludedResults: readonly number[];
}

export interface PairCycleFixedMode extends FixedModeBase {
  kind: 'pair-cycle';
}

export type FixedMode = SequenceFixedMode | PairCycleFixedMode;

export const fixedModes: readonly FixedMode[] = [
  {
    id: 'fate-ten',
    kind: 'sequence',
    themeId: 'adventure',
    name: '命运十抽',
    description: '第 4、8 次魔鬼；第 1–3、5–7 次各 1 张复活；其余三卡各至少 1 次',
    icon: '✦',
    totalDraws: 10,
    forcedResults: { 4: 0, 8: 0 },
    excludedResults: [0, 4],
  },
  {
    id: 'relaxed-pairs',
    kind: 'pair-cycle',
    themeId: 'relaxed',
    name: '我的音乐搭配',
    description: '开启后，所有模式中的轻松卡按收藏顺序循环播放',
    icon: '♫',
  },
];

export const createFateTenRevivalDraws = (random = Math.random): readonly [number, number] => [
  1 + Math.floor(random() * 3),
  5 + Math.floor(random() * 3),
];

export const createFateTenDrawSequence = (random = Math.random): readonly number[] => {
  const results = Array<number>(10).fill(-1);
  const revivalDraws = createFateTenRevivalDraws(random);
  results[3] = 0;
  results[7] = 0;
  revivalDraws.forEach(drawNumber => { results[drawNumber - 1] = 4; });

  // Six open positions: guarantee angel, hint, and simple once, then vary the other three.
  const remaining = [1, 2, 3, ...Array.from({ length: 3 }, () => 1 + Math.floor(random() * 3))];
  for (let index = remaining.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [remaining[index], remaining[swap]] = [remaining[swap], remaining[index]];
  }
  let next = 0;
  return results.map(result => result === -1 ? remaining[next++] : result);
};

export const drawFixedMode = (mode: SequenceFixedMode, drawNumber: number, random = Math.random): number | null => {
  if (!Number.isInteger(drawNumber) || drawNumber < 1 || drawNumber > mode.totalDraws) return null;
  const forced = mode.forcedResults[drawNumber];
  if (forced !== undefined) return forced;
  const eligible = multiplayerSegments.map((_, index) => index).filter(index => !mode.excludedResults.includes(index));
  if (!eligible.length) return null;
  const position = Math.min(eligible.length - 1, Math.max(0, Math.floor(random() * eligible.length)));
  return eligible[position];
};
