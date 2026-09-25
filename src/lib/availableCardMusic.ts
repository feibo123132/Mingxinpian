import { resolveAssetPath } from './assetPaths.ts';

type MusicSlot = string | readonly string[];

const optionalCardMusicPrefixes: Record<string, string> = {
  'adventure-3': 'adventure-card-03',
  'adventure-4': 'adventure-card-04',
  'adventure-5': 'adventure-card-05',
  'relaxed-1': 'relaxed-card',
  'relaxed-2': 'relaxed-card',
  'relaxed-3': 'relaxed-card-03',
  ...Object.fromEntries(Array.from({ length: 5 }, (_, index) => [String(index + 1), `card${index + 1}`])),
  ...Object.fromEntries(Array.from({ length: 10 }, (_, index) => [
    `summer-${index + 1}`,
    `summer-card-${String(index + 1).padStart(2, '0')}`,
  ])),
};

export const createAvailableMusicPicker = (
  slots: readonly MusicSlot[],
  isAvailable: (src: string) => Promise<boolean>,
  random = Math.random,
) => {
  let remaining: string[] = [];
  let pending = Promise.resolve();

  const pick = async (): Promise<string | null> => {
    if (remaining.length === 0) {
      const found = await Promise.all(slots.map(async slot => {
        for (const src of typeof slot === 'string' ? [slot] : slot) {
          if (await isAvailable(src)) return src;
        }
        return null;
      }));
      remaining = found.filter((src): src is string => src !== null);
      for (let index = remaining.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(random() * (index + 1));
        [remaining[index], remaining[swapIndex]] = [remaining[swapIndex], remaining[index]];
      }
    }
    return remaining.pop() ?? null;
  };

  return () => {
    const result = pending.then(pick);
    pending = result.then(() => undefined, () => undefined);
    return result;
  };
};

export const createSequentialMusicPicker = (
  firstPaths: readonly string[],
  numberedPath: (index: number) => string,
  isAvailable: (src: string) => Promise<boolean>,
  random = Math.random,
) => {
  let remaining: string[] = [];
  let pending = Promise.resolve();

  const pick = async (): Promise<string | null> => {
    if (remaining.length === 0) {
      remaining = await discoverSequentialAudio(firstPaths, numberedPath, isAvailable);
      for (let index = remaining.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1));
        [remaining[index], remaining[swapIndex]] = [remaining[swapIndex], remaining[index]];
      }
    }
    return remaining.pop() ?? null;
  };

  return () => {
    const result = pending.then(pick);
    pending = result.then(() => undefined, () => undefined);
    return result;
  };
};

export const discoverSequentialAudio = async (
  firstPaths: readonly string[],
  numberedPath: (index: number) => string,
  isAvailable: (src: string) => Promise<boolean>,
): Promise<string[]> => {
  let first: string | null = null;
  for (const src of firstPaths) {
    if (await isAvailable(src)) { first = src; break; }
  }
  if (!first) return [];

  const found = [first];
  for (let index = 2; await isAvailable(numberedPath(index)); index += 1) {
    found.push(numberedPath(index));
  }
  return found;
};

export const completionVoiceCandidates = [
  '/audio/adventure-completion-voice1.mp3',
  '/audio/adventure-completion-voice2.mp3',
];

export const completionMusicCandidates = [
  '/audio/adventure-completion-music1.mp3',
  '/audio/adventure-completion-music2.mp3',
];

export const createCompletionAudioPicker = (
  isAvailable: (src: string) => Promise<boolean>,
  random = Math.random,
) => {
  const pickVoice = createAvailableMusicPicker(completionVoiceCandidates, isAvailable, random);
  const pickMusic = createSequentialMusicPicker(
    [completionMusicCandidates[0]],
    index => `/audio/adventure-completion-music${index}.mp3`,
    isAvailable,
    random,
  );

  return async () => {
    const [voice, music] = await Promise.all([pickVoice(), pickMusic()]);
    return { voice, music };
  };
};

const knownAudio = new Map<string, Promise<boolean>>();
export const probeAudio = (src: string): Promise<boolean> => {
  const cached = knownAudio.get(src);
  if (cached) return cached;

  const probe = new Promise<boolean>(resolve => {
    const audio = new Audio();
    const timeout = globalThis.setTimeout(() => finish(false), 2500);
    const finish = (available: boolean) => {
      globalThis.clearTimeout(timeout);
      audio.onloadedmetadata = null;
      audio.onerror = null;
      if (available) knownAudio.set(src, Promise.resolve(true));
      else knownAudio.delete(src);
      resolve(available);
    };
    audio.onloadedmetadata = () => finish(true);
    audio.onerror = () => finish(false);
    audio.preload = 'metadata';
    audio.src = resolveAssetPath(src);
    audio.load();
  });
  knownAudio.set(src, probe);
  return probe;
};

export const createOptionalCardMusicSelector = (
  isAvailable: (src: string) => Promise<boolean>,
  random = Math.random,
) => {
  const pickers = new Map<string, () => Promise<string | null>>();

  return (cardId: string): Promise<string | null> => {
    const prefix = Object.prototype.hasOwnProperty.call(optionalCardMusicPrefixes, cardId)
      ? optionalCardMusicPrefixes[cardId]
      : undefined;
    if (!prefix) return Promise.resolve(null);

    let picker = pickers.get(prefix);
    if (!picker) {
      picker = createSequentialMusicPicker(
        [`/audio/${prefix}-music.mp3`, `/audio/${prefix}-music1.mp3`],
        index => `/audio/${prefix}-music${index}.mp3`,
        isAvailable,
        random,
      );
      pickers.set(prefix, picker);
    }
    return picker();
  };
};

export const pickOptionalCardMusic = createOptionalCardMusicSelector(probeAudio);
export const pickCompletionAudio = createCompletionAudioPicker(probeAudio);
