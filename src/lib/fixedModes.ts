import { multiplayerSegments } from './multiplayer.ts';

interface FixedModeBase {
  id: string;
  name: string;
  description: string;
  icon: string;
  themeId: 'adventure' | 'adventure-2' | 'relaxed';
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
    id: 'fate-eight',
    kind: 'sequence',
    themeId: 'adventure',
    name: '命运八抽',
    description: '第 5–8 抽仅 1 张魔鬼；第 1–3 抽仅 1 张复活；第 3–6 抽仅 1 张轻松；天使、提示、连唱各至少 1 张',
    icon: '✦',
    totalDraws: 8,
    forcedResults: {},
    excludedResults: [0, 4],
  },
  {
    id: 'fate-four',
    kind: 'sequence',
    themeId: 'adventure-2',
    name: '命运四抽',
    description: '勇者大闯关：四张卡各抽 1 次，随机额外触发 1 次轻松卡',
    icon: '✦',
    totalDraws: 4,
    forcedResults: {},
    excludedResults: [4],
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

export const createFateEightDrawSequence = (random = Math.random): readonly number[] => {
  const results = Array<number>(8).fill(-1);
  const devilDraw = 5 + Math.floor(random() * 4);
  const revivalDraw = 1 + Math.floor(random() * 3);
  results[devilDraw - 1] = 0;
  results[revivalDraw - 1] = 4;

  // Six open positions: guarantee angel, hint, and singing once, then vary the other three.
  const remaining = [1, 2, 3, ...Array.from({ length: 3 }, () => 1 + Math.floor(random() * 3))];
  for (let index = remaining.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [remaining[index], remaining[swap]] = [remaining[swap], remaining[index]];
  }
  let next = 0;
  return results.map(result => result === -1 ? remaining[next++] : result);
};

export const createFixedModeDrawSequence = (mode: SequenceFixedMode, random = Math.random): readonly number[] | null => {
  if (mode.id === 'fate-eight') return createFateEightDrawSequence(random);
  if (mode.id !== 'fate-four') return null;
  const results = [0, 1, 2, 3];
  for (let index = results.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [results[index], results[swap]] = [results[swap], results[index]];
  }
  return results;
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
