import type { AppTheme, Postcard } from './types.ts';

const createSummerCardImage = (title: string, emoji: string, color: string, accent: string) => {
  const svg = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx="42" fill="#fffdf5"/>
      <circle cx="408" cy="86" r="58" fill="${accent}" opacity="0.9"/>
      <path d="M0 354 C96 306 168 406 258 354 C342 306 416 384 512 334 L512 512 L0 512 Z" fill="${color}" opacity="0.92"/>
      <path d="M0 408 C106 360 176 456 270 402 C360 350 424 430 512 378 L512 512 L0 512 Z" fill="#35c9c4" opacity="0.82"/>
      <text x="256" y="215" text-anchor="middle" font-size="94" font-family="Arial, sans-serif">${emoji}</text>
      <text x="256" y="294" text-anchor="middle" font-size="38" font-weight="700" fill="#1f4f55" font-family="Arial, sans-serif">${title}</text>
      <text x="256" y="336" text-anchor="middle" font-size="21" fill="#5f777a" font-family="Arial, sans-serif">夏日海盐明信片</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const summerCards: Postcard[] = [
  {
    id: 'summer-1',
    title: '海风来信',
    content: '愿今天吹来的风，刚好把你的烦恼轻轻带走。',
    image: createSummerCardImage('海风来信', '🌊', '#80e4de', '#ffd166'),
    sound: '/audio/card1.mp3',
  },
  {
    id: 'summer-2',
    title: '柠檬好运',
    content: '把酸涩变成清爽，把普通日子过成闪光汽水。',
    image: createSummerCardImage('柠檬好运', '🍋', '#ffe27a', '#ff8a65'),
    sound: '/audio/card2.mp3',
  },
  {
    id: 'summer-3',
    title: '日光拥抱',
    content: '今天适合被阳光鼓励，也适合认真喜欢自己。',
    image: createSummerCardImage('日光拥抱', '☀️', '#ffb86b', '#ffe66d'),
    sound: '/audio/card3.mp3',
  },
  {
    id: 'summer-4',
    title: '贝壳心愿',
    content: '把心愿悄悄放进贝壳，海浪会替你记得。',
    image: createSummerCardImage('贝壳心愿', '🐚', '#ffafcc', '#9bf6ff'),
    sound: '/audio/card4.mp3',
  },
  {
    id: 'summer-5',
    title: '晚霞收藏',
    content: '愿你收藏今天的晚霞，也收藏一个温柔的自己。',
    image: createSummerCardImage('晚霞收藏', '🌅', '#ff8fab', '#ffd166'),
    sound: '/audio/card5.mp3',
  },
];

export const summerTheme: AppTheme = {
  id: 'summer',
  name: '夏日海盐',
  shortName: '夏日',
  description: '清爽、明亮、有海风感，适合假期活动和轻松社群互动。',
  icon: '🌊',
  title: '夏日海盐转盘',
  subtitle: '点击海盐LOGO按钮，抽取你的夏日明信片！',
  footer: '把这一刻交给海风，看看今天会收到哪一封温柔来信。',
  background: 'linear-gradient(135deg, #f9fff8 0%, #dff9f5 46%, #fff1c7 100%)',
  surface: '#ffffff',
  titleColor: '#12445a',
  bodyColor: '#47656b',
  mutedColor: '#6f8588',
  accentColor: '#ffb85c',
  accentTextColor: '#5c3300',
  settingsIcon: '☀️',
  preview: {
    label: '海风明信片',
    colors: ['#35c9c4', '#ffb85c', '#fff06a', '#ff7f74', '#7fb8ff'],
  },
  startButton: {
    label: 'SEA',
    sublabel: 'LOGO',
    ariaLabel: '点击海盐LOGO按钮开始抽卡',
    background: 'linear-gradient(145deg, #ffffff 0%, #d8fff7 52%, #ffe7a8 100%)',
    borderColor: '#ffffff',
    textColor: '#11606a',
    shadow: '0 16px 34px rgba(25, 133, 138, 0.28)',
  },
  wheel: {
    colors: ['#35c9c4', '#ffb85c', '#fff06a', '#ff7f74', '#7fb8ff'],
    labelColor: '#ffffff',
    hubColor: '#fffdf5',
    pointerColor: '#fffdf5',
  },
  audio: {
    spin: '/audio/spin.mp3',
    bgm: ['/audio/bgm1.mp3', '/audio/bgm2.mp3', '/audio/bgm3.mp3'],
  },
  cards: summerCards,
};
