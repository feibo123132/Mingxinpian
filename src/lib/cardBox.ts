export type CardBox = Record<string, number>;

export const collectCard = (box: CardBox, cardId: string): CardBox => ({
  ...box,
  [cardId]: (box[cardId] ?? 0) + 1,
});

export const consumeCard = (box: CardBox, cardId: string): CardBox => {
  const count = box[cardId] ?? 0;
  if (count <= 0) return box;
  const next = { ...box };
  if (count === 1) delete next[cardId];
  else next[cardId] = count - 1;
  return next;
};
