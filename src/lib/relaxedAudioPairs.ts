export const RELAXED_PAIRS_STORAGE_KEY = 'fixed-mode:relaxed-audio-pairs:v1';

export const relaxedPairSounds = [1, 2, 3].map(number => `/audio/relaxed-card-0${number}.mp3`);
export const relaxedPairMusic = [
  '/audio/relaxed-card-music.mp3',
  '/audio/relaxed-card-music2.mp3',
  '/audio/relaxed-card-music3.mp3',
];

export interface RelaxedAudioPair {
  id: string;
  sound: string;
  music: string;
}

export const normalizeRelaxedAudioPairs = (value: unknown): RelaxedAudioPair[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.filter((item): item is RelaxedAudioPair => {
    if (!item || typeof item !== 'object') return false;
    const pair = item as Partial<RelaxedAudioPair>;
    if (typeof pair.id !== 'string' || !pair.id || seen.has(pair.id)) return false;
    if (!relaxedPairSounds.includes(pair.sound ?? '') || !relaxedPairMusic.includes(pair.music ?? '')) return false;
    seen.add(pair.id);
    return true;
  }).slice(0, 10).map(({ id, sound, music }) => ({ id, sound, music }));
};

export const loadRelaxedAudioPairs = (): RelaxedAudioPair[] => {
  try {
    return normalizeRelaxedAudioPairs(JSON.parse(window.localStorage.getItem(RELAXED_PAIRS_STORAGE_KEY) ?? '[]'));
  } catch {
    return [];
  }
};

export const saveRelaxedAudioPairs = (pairs: RelaxedAudioPair[]): RelaxedAudioPair[] => {
  const valid = normalizeRelaxedAudioPairs(pairs);
  try { window.localStorage.setItem(RELAXED_PAIRS_STORAGE_KEY, JSON.stringify(valid)); } catch { /* Keep the current session usable. */ }
  return valid;
};

export const getRelaxedAudioPairForDraw = (pairs: readonly RelaxedAudioPair[], drawIndex: number): RelaxedAudioPair | null =>
  pairs.length && Number.isInteger(drawIndex) && drawIndex >= 0 ? pairs[drawIndex % pairs.length] : null;
