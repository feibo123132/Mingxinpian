import type { AppTheme } from './types.ts';

const colors = ['#e8c65b', '#a9be91', '#eca183'];
const messages = [
  ['轻松绷住', '直接轻松绷住了'],
  ['为人严肃', '我们受过严格的训练，无论多好笑呢，我们都不会笑'],
  ['正常演唱', '跟着旋律，认真唱出你喜欢的歌。'],
];

export const relaxedTheme: AppTheme = {
  id: 'relaxed',
  name: '轻松绷住',
  shortName: '轻松绷住',
  description: '奶油黄与鼠尾草绿，给紧绷的日常一点幽默和松弛。',
  icon: '😌',
  title: '轻松绷住',
  subtitle: '点击「抽取」，获取今日份的松弛感',
  footer: '生活偶尔绷不住，记得对自己松一点。',
  background: 'linear-gradient(135deg, #fffaf0 0%, #f4f0da 48%, #e3ecd9 100%)',
  surface: '#fffdf5',
  titleColor: '#384638',
  bodyColor: '#58614e',
  mutedColor: '#78816d',
  accentColor: '#e8c65b',
  accentTextColor: '#493d1b',
  settingsIcon: '😌',
  preview: { label: '今日份松弛感', colors: colors.slice(0, 5) },
  startButton: {
    label: '抽取',
    ariaLabel: '点击抽取，获取今日份的松弛感',
    background: 'linear-gradient(145deg, #fffdf5, #f6e4a0)',
    borderColor: '#fffdf5',
    textColor: '#384638',
    shadow: '0 14px 30px rgba(88, 97, 65, 0.22)',
  },
  wheel: { colors, labelColor: '#344132', hubColor: '#fffdf5', pointerColor: '#fffdf5' },
  audio: { spin: '/audio/spin.mp3', bgm: ['/audio/summer-bgm1.mp3', '/audio/summer-bgm2.mp3', '/audio/summer-bgm3.mp3'] },
  cards: messages.map(([title, content], index) => ({
    id: `relaxed-${index + 1}`,
    title,
    content,
    image: ['/images/themes/relaxed/relaxed-meme.jpg', '/images/themes/relaxed/serious-abstract.jpg', '/images/themes/relaxed/card-03.svg'][index],
    sound: index < 2 ? `/audio/relaxed-card-${String(index + 1).padStart(2, '0')}.mp3` : '',
  })),
};
