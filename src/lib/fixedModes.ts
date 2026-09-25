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
    description: '第 1、5 次复活；第 3、6、10 次魔鬼',
    icon: '✦',
    totalDraws: 10,
    forcedResults: { 1: 4, 3: 0, 5: 4, 6: 0, 10: 0 },
    excludedResults: [0],
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

export const drawFixedMode = (mode: SequenceFixedMode, drawNumber: number, random = Math.random): number | null => {
  if (!Number.isInteger(drawNumber) || drawNumber < 1 || drawNumber > mode.totalDraws) return null;
  const forced = mode.forcedResults[drawNumber];
  if (forced !== undefined) return forced;
  const eligible = multiplayerSegments.map((_, index) => index).filter(index => !mode.excludedResults.includes(index));
  if (!eligible.length) return null;
  const position = Math.min(eligible.length - 1, Math.max(0, Math.floor(random() * eligible.length)));
  return eligible[position];
};
