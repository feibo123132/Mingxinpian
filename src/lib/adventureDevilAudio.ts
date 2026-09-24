export const devilMusicTracks = [
  '/audio/adventure-devil-music.mp3',
  '/audio/adventure-devil2-music.mp3',
  '/audio/adventure-devil3-music.mp3',
  '/audio/adventure-devil4-music.mp3',
];

export const createDevilMusicPicker = (random = Math.random) => {
  let remaining: string[] = [];

  return () => {
    if (remaining.length === 0) {
      remaining = [...devilMusicTracks];
      for (let index = remaining.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(random() * (index + 1));
        [remaining[index], remaining[swapIndex]] = [remaining[swapIndex], remaining[index]];
      }
    }
    return remaining.pop()!;
  };
};
