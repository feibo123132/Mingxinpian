type CardAudioPlayer = Pick<HTMLAudioElement, 'pause' | 'play' | 'dispatchEvent'>;

export const pausePendingCardAudio = (pending: ReadonlySet<CardAudioPlayer> | null): boolean => {
  if (!pending?.size) return false;
  pending.forEach(audio => audio.pause());
  return true;
};

export const resumePendingCardAudio = (pending: ReadonlySet<CardAudioPlayer> | null): boolean => {
  if (!pending?.size) return false;
  pending.forEach(audio => {
    const fail = () => audio.dispatchEvent(new Event('error'));
    try { void audio.play().catch(fail); } catch { fail(); }
  });
  return true;
};
