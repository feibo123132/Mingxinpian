import type { AppTheme, Postcard } from './types.ts';

const summerCardImagePath = (index: number) =>
  `/images/themes/summer/card-${String(index).padStart(2, '0')}.png`;

const summerCards: Postcard[] = [
  {
    id: 'summer-1',
    title: '儿童节快乐',
    content: '祝每个长成大人的小孩，节日快乐！',
    image: summerCardImagePath(1),
    sound: '/audio/summer-card-01.mp3',
  },
  {
    id: 'summer-2',
    title: '一起看看云',
    content: '不用总是拔足狂奔，偶尔停下来看看云，也是在好好生活。',
    image: summerCardImagePath(2),
    sound: '/audio/summer-card-02.mp3',
  },
  {
    id: 'summer-3',
    title: '心不老',
    content: '永远年轻，永远热泪盈眶。',
    image: summerCardImagePath(3),
    sound: '/audio/summer-card-03.mp3',
  },
  {
    id: 'summer-4',
    title: '自己的太阳',
    content: '愿你成为自己的太阳，无需借谁的光。',
    image: summerCardImagePath(4),
    sound: '/audio/summer-card-04.mp3',
  },
  {
    id: 'summer-5',
    title: '吃点好的',
    content:
      '做大人从来都不是件容易的事，觉得累的话，记得好好休息，给自己买些好吃的。',
    image: summerCardImagePath(5),
    sound: '/audio/summer-card-05.mp3',
  },
  {
    id: 'summer-6',
    title: '一蓑烟雨任平生',
    content: '莫听穿林打叶声，何妨吟啸且徐行……回首向来萧瑟处，归去，也无风雨也无晴。',
    image: summerCardImagePath(6),
    sound: '/audio/summer-card-06.mp3',
  },
  {
    id: 'summer-7',
    title: '一路生花',
    content: '花会沿路盛开，你以后的路也是。',
    image: summerCardImagePath(7),
    sound: '/audio/summer-card-07.mp3',
  },
  {
    id: 'summer-8',
    title: '高山低谷',
    content: '若是深处低谷，怎么走都是向上。',
    image: summerCardImagePath(8),
    sound: '/audio/summer-card-08.mp3',
  },
  {
    id: 'summer-9',
    title: '热爱生活',
    content:
      '世界上只有一种真正的英雄主义，那就是，在认清生活的真相后，依然选择热爱生活。',
    image: summerCardImagePath(9),
    sound: '/audio/summer-card-09.mp3',
  },
  {
    id: 'summer-10',
    title: '群星为你闪烁',
    content: '当你为错过太阳而哭泣时，你也要再错过群星了。',
    image: summerCardImagePath(10),
    sound: '/audio/summer-card-10.mp3',
  },
];

export const summerTheme: AppTheme = {
  id: 'summer',
  name: '夏日海盐',
  shortName: '夏日',
  description: '清爽、明亮、有海风感，适合假期活动和轻松社群互动。',
  icon: '🌊',
  title: '风吹一夏',
  subtitle: '点击JIEYOU按钮，抽取你的夏日明信片',
  footer: '爱自己，是终身美丽的开始',
  background: 'linear-gradient(135deg, #f9fff8 0%, #dff9f5 46%, #fff1c7 100%)',
  surface: '#ffffff',
  titleColor: '#12445a',
  bodyColor: '#47656b',
  mutedColor: '#6f8588',
  accentColor: '#ffb85c',
  accentTextColor: '#5c3300',
  settingsIcon: '⚙️',
  preview: {
    label: '海风明信片',
    colors: ['#35c9c4', '#ffb85c', '#fff06a', '#ff7f74', '#7fb8ff'],
  },
  startButton: {
    image: '/images/themes/summer/start-button.png',
    label: 'SEA',
    sublabel: 'LOGO',
    ariaLabel: '点击JIEYOU按钮开始抽卡',
    background: 'linear-gradient(145deg, #ffffff 0%, #d8fff7 52%, #ffe7a8 100%)',
    borderColor: '#ffffff',
    textColor: '#11606a',
    shadow: '0 16px 34px rgba(25, 133, 138, 0.28)',
  },
  wheel: {
    colors: [
      '#5fdfe1',
      '#5a92e8',
      '#7358e8',
      '#cf5de3',
      '#e65dab',
      '#ef6363',
      '#f7b85d',
      '#d6f052',
      '#7dea56',
      '#58e38c',
    ],
    labelColor: '#ffffff',
    hubColor: '#fffdf5',
    pointerColor: '#fffdf5',
  },
  audio: {
    spin: '/audio/spin.mp3',
    bgm: ['/audio/summer-bgm1.mp3', '/audio/summer-bgm2.mp3', '/audio/summer-bgm3.mp3'],
  },
  cards: summerCards,
};
