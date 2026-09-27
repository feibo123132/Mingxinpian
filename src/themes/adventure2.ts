import { adventureTheme } from './adventure.ts';
import type { AppTheme } from './types.ts';

export const adventure2Theme: AppTheme = {
  ...adventureTheme,
  id: 'adventure-2',
  name: '勇者大闯关②',
  shortName: '勇者大闯关②',
  title: '勇者大闯关②',
  preview: { label: '勇者大闯关②', colors: adventureTheme.wheel.colors.slice(0, 4) },
  wheel: { ...adventureTheme.wheel, colors: adventureTheme.wheel.colors.slice(0, 4) },
  cards: [
    ...adventureTheme.cards.slice(0, 3).map(card => ({ ...card })),
    {
      id: 'adventure-6',
      title: '连唱卡',
      content: '连续演唱，挑战继续！',
      image: '/images/adventure-card-06.png',
      fallbackImage: '/images/adventure-card-06.svg',
      sound: '/audio/adventure-card-06.mp3',
    },
  ],
};
