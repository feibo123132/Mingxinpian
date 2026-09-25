import type { Postcard } from '../themes/types.ts';
import { createSequentialMusicPicker, probeAudio } from './availableCardMusic.ts';

export const relaxedCardSounds = [
  '/audio/relaxed-card-01.mp3',
  '/audio/relaxed-card-02.mp3',
  '/audio/relaxed-card-03.mp3',
];

export const createRelaxedCardSoundPicker = (
  random = Math.random,
  isAvailable: (src: string) => Promise<boolean> = probeAudio,
) => createSequentialMusicPicker(
  [relaxedCardSounds[0]],
  index => `/audio/relaxed-card-${String(index).padStart(2, '0')}.mp3`,
  isAvailable,
  random,
);

const pickRelaxedCardSound = createRelaxedCardSoundPicker();

export const selectCardSound = (
  themeId: string,
  card: Postcard,
  pick = pickRelaxedCardSound,
): Promise<string> => themeId === 'relaxed' && (card.id === 'relaxed-1' || card.id === 'relaxed-2')
  ? pick().then(sound => sound ?? card.sound)
  : Promise.resolve(card.sound);
