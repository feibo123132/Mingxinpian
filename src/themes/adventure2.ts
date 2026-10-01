import { adventureTheme } from './adventure.ts';
import type { AppTheme } from './types.ts';

export const adventure2Theme: AppTheme = {
  ...adventureTheme,
  id: 'adventure-2',
  name: '勇者大闯关',
  shortName: '勇者大闯关',
  title: '勇者大闯关',
  preview: { label: '勇者大闯关', colors: adventureTheme.wheel.colors.slice(0, 4) },
  wheel: { ...adventureTheme.wheel, colors: adventureTheme.wheel.colors.slice(0, 4) },
  cards: adventureTheme.cards.slice(0, 4).map(card => ({ ...card })),
};
