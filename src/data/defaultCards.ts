import type { Postcard } from '../themes/types.ts';

export type { Postcard };

const card1 = new URL('../assets/postcards/card1.png', import.meta.url).href;
const card2 = new URL('../assets/postcards/card2.png', import.meta.url).href;
const card3 = new URL('../assets/postcards/card3.png', import.meta.url).href;
const card4 = new URL('../assets/postcards/card4.png', import.meta.url).href;
const card5 = new URL('../assets/postcards/card5.png', import.meta.url).href;

export const defaultCards: Postcard[] = [
  {
    id: '1',
    title: '所愿皆所得',
    content: '新年新气象，愿你所愿皆所得！',
    image: card1,
    sound: '/audio/card1.mp3',
  },
  {
    id: '2',
    title: '更好的自己',
    content: '新的一年，遇见更好的自己！',
    image: card2,
    sound: '/audio/card2.mp3',
  },
  {
    id: '3',
    title: '事事皆顺遂',
    content: '新年新气象，愿你事事皆顺遂！',
    image: card3,
    sound: '/audio/card3.mp3',
  },
  {
    id: '4',
    title: '生活多点甜',
    content: '希望你的生活多一点甜，烦恼少一点点。',
    image: card4,
    sound: '/audio/card4.mp3',
  },
  {
    id: '5',
    title: '平安喜乐',
    content: '平安喜乐，逢考必过，所有期待都慢慢靠近。',
    image: card5,
    sound: '/audio/card5.mp3',
  },
];
