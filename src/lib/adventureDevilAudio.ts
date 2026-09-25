import { createSequentialMusicPicker, probeAudio } from './availableCardMusic.ts';

export const devilMusicTracks = [
  '/audio/adventure-devil-music.mp3',
  '/audio/adventure-devil2-music.mp3',
  '/audio/adventure-devil3-music.mp3',
  '/audio/adventure-devil4-music.mp3',
];

export const createDevilMusicPicker = (
  random = Math.random,
  isAvailable: (src: string) => Promise<boolean> = probeAudio,
) => createSequentialMusicPicker(
  [devilMusicTracks[0]],
  index => `/audio/adventure-devil${index}-music.mp3`,
  isAvailable,
  random,
);
