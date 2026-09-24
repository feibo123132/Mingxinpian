export const angelMusicCandidates = [
  '/audio/adventure-angel1-music.mp3',
  '/audio/adventure-angel2-music.mp3',
  '/audio/adventure-angel3-music.mp3',
];

export const createAngelMusicPicker = (random = Math.random) => {
  let remaining: string[] = [];

  return () => {
    if (remaining.length === 0) {
      remaining = [...angelMusicCandidates];
      for (let index = remaining.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(random() * (index + 1));
        [remaining[index], remaining[swapIndex]] = [remaining[swapIndex], remaining[index]];
      }
    }
    return remaining.pop()!;
  };
};
