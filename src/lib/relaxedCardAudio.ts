import type { Postcard } from '../themes/types.ts';

export const relaxedCardSounds = [
  '/audio/relaxed-card-01.mp3',
  '/audio/relaxed-card-02.mp3',
  '/audio/relaxed-card-03.mp3',
];

export const createRelaxedCardSoundPicker = (random = Math.random) => {
  let remaining: string[] = [];

  return () => {
    if (remaining.length === 0) {
      remaining = [...relaxedCardSounds];
      for (let index = remaining.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(random() * (index + 1));
        [remaining[index], remaining[swapIndex]] = [remaining[swapIndex], remaining[index]];
      }
    }
    return remaining.pop()!;
  };
};

const pickRelaxedCardSound = createRelaxedCardSoundPicker();

export const selectCardSound = (
  themeId: string,
  card: Postcard,
  pick = pickRelaxedCardSound,
) => themeId === 'relaxed' && (card.id === 'relaxed-1' || card.id === 'relaxed-2')
  ? pick()
  : card.sound;
