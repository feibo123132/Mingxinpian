import { createSequentialMusicPicker, probeAudio } from './availableCardMusic.ts';

export const angelMusicCandidates = [
  '/audio/adventure-angel1-music.mp3',
  '/audio/adventure-angel2-music.mp3',
  '/audio/adventure-angel3-music.mp3',
];

export const createAngelMusicPicker = (
  random = Math.random,
  isAvailable: (src: string) => Promise<boolean> = probeAudio,
) => createSequentialMusicPicker(
  [angelMusicCandidates[0]],
  index => `/audio/adventure-angel${index}-music.mp3`,
  isAvailable,
  random,
);
