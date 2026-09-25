import { resolveAssetPath } from './assetPaths.ts';

type MusicSlot = string | readonly string[];

const musicSlots = (prefix: string): MusicSlot[] => [
  [`/audio/${prefix}-music.mp3`, `/audio/${prefix}-music1.mp3`],
  `/audio/${prefix}-music2.mp3`,
  `/audio/${prefix}-music3.mp3`,
];

const sharedRelaxedMusicSlots = musicSlots('relaxed-card');

export const optionalCardMusicSlots: Record<string, MusicSlot[]> = {
  'adventure-3': musicSlots('adventure-card-03'),
  'adventure-4': musicSlots('adventure-card-04'),
  'adventure-5': musicSlots('adventure-card-05'),
  'relaxed-1': sharedRelaxedMusicSlots,
  'relaxed-2': sharedRelaxedMusicSlots,
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
  const pickMusic = createAvailableMusicPicker(completionMusicCandidates, isAvailable, random);

  return async () => {
    const [voice, music] = await Promise.all([pickVoice(), pickMusic()]);
    return { voice, music };
  };
};

const knownAudio = new Map<string, Promise<boolean>>();
const probeAudio = (src: string): Promise<boolean> => {
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
  const pickers = new Map<MusicSlot[], () => Promise<string | null>>();

  return (cardId: string): Promise<string | null> => {
    const slots = optionalCardMusicSlots[cardId];
    if (!slots) return Promise.resolve(null);

    let picker = pickers.get(slots);
    if (!picker) {
      picker = createAvailableMusicPicker(slots, isAvailable, random);
      pickers.set(slots, picker);
    }
    return picker();
  };
};

export const pickOptionalCardMusic = createOptionalCardMusicSelector(probeAudio);
export const pickCompletionAudio = createCompletionAudioPicker(probeAudio);
