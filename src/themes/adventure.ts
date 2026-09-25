import { relaxedTheme } from './relaxed.ts';
import { multiplayerSegments } from '../lib/multiplayer.ts';
import type { AppTheme } from './types.ts';

export const adventureTheme: AppTheme = {
  ...relaxedTheme,
  id: 'adventure',
  name: '勇者大闯关',
  shortName: '勇者大闯关',
  icon: '⚔️',
  title: '勇者大闯关',
  description: '一个人连闯几轮，也可以和朋友一起挑战。',
  subtitle: '一个人多轮挑战，或和朋友一起闯关',
  footer: '每个转盘，都是一次新的冒险。',
  settingsIcon: '⚔️',
  background: 'linear-gradient(135deg, #fffaf0 0%, #fff2d2 100%)',
  preview: { label: '勇者大闯关', colors: multiplayerSegments.map(segment => segment.color) },
  wheel: { ...relaxedTheme.wheel, colors: multiplayerSegments.map(segment => segment.color) },
  cards: multiplayerSegments.map((segment, index) => ({
    id: `adventure-${index + 1}`,
    title: segment.label,
    content: ['传说来自天堂的魔鬼！', '我来助你！', '给个提示呗', '简简单单啦', '复活吧！我的勇士！'][index],
    image: `/images/adventure-card-${String(index + 1).padStart(2, '0')}.png`,
    video: `/videos/adventure-card-${String(index + 1).padStart(2, '0')}.mp4`,
    sound: `/audio/adventure-card-${String(index + 1).padStart(2, '0')}.mp3`,
  })),
};
