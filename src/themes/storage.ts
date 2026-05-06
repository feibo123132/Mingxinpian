import type { Postcard } from './types.ts';

export const ACTIVE_THEME_STORAGE_KEY = 'active-theme-id';
export const LEGACY_CARD_STORAGE_KEY = 'postcard-config';
export const MAX_POSTCARDS = 10;
export const MIN_POSTCARDS = 1;

export const getCardStorageKey = (themeId: string) => `postcard-config:${themeId}`;

const createBlankCard = (index: number, fallback: Postcard[]): Postcard => {
  const base = fallback[index % Math.max(fallback.length, 1)];

  return {
    id: `card-${index + 1}`,
    title: `Card ${index + 1}`,
    content: '',
    image: '',
    sound: base?.sound || '/audio/card1.mp3',
  };
};

const normalizeCards = (cards: unknown, fallback: Postcard[]) => {
  if (!Array.isArray(cards)) return fallback;

  return cards.slice(0, MAX_POSTCARDS).map((savedCard, index) => {
    const baseCard = fallback[index] ?? createBlankCard(index, fallback);
    if (!savedCard || typeof savedCard !== 'object') return baseCard;

    const partial = savedCard as Partial<Postcard>;

    return {
      ...baseCard,
      ...partial,
      id: partial.id || baseCard.id,
      title: partial.title || baseCard.title,
      content: partial.content || baseCard.content,
      image: partial.image || baseCard.image,
      sound: partial.sound || baseCard.sound,
    };
  });
};

export const loadCardsForTheme = (themeId: string, fallback: Postcard[]) => {
  if (typeof window === 'undefined') return fallback;

  try {
    const storageKey = getCardStorageKey(themeId);
    const saved = window.localStorage.getItem(storageKey);
    const legacySaved =
      themeId === 'christmas' ? window.localStorage.getItem(LEGACY_CARD_STORAGE_KEY) : null;
    const raw = saved ?? legacySaved;

    if (!raw) return fallback;

    const normalized = normalizeCards(JSON.parse(raw), fallback);

    if (!saved && legacySaved) {
      window.localStorage.setItem(storageKey, JSON.stringify(normalized));
    }

    return normalized;
  } catch (error) {
    console.error(`Error reading cards for theme "${themeId}":`, error);
    return fallback;
  }
};

export const saveCardsForTheme = (themeId: string, cards: Postcard[]) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(getCardStorageKey(themeId), JSON.stringify(cards.slice(0, MAX_POSTCARDS)));
  } catch (error) {
    console.error(`Error saving cards for theme "${themeId}":`, error);
  }
};
