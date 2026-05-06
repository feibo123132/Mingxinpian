import { defaultCards } from '../data/defaultCards.ts';
import type { AppTheme } from './types.ts';

export const christmasTheme: AppTheme = {
  id: 'christmas',
  name: '圣诞大转盘',
  shortName: '圣诞',
  description: '保留原本的节日抽卡氛围，适合年末祝福和社团活动。',
  icon: '🎅',
  title: '圣诞大转盘',
  subtitle: '点击社团LOGO按钮，抽取你的幸运明信片！',
  footer: '2025年快结束了，这一年你又经历哪些难忘的瞬间呢？',
  background: 'linear-gradient(135deg, #fff9e7 0%, #fff3d6 48%, #ffe8cc 100%)',
  surface: '#fffaf0',
  titleColor: '#1f2937',
  bodyColor: '#4b5563',
  mutedColor: '#64748b',
  accentColor: '#FFD748',
  accentTextColor: '#7a4f00',
  settingsIcon: '🎄',
  preview: {
    label: '年末祝福',
    colors: ['#FF6B6B', '#FFD748', '#7C90FF', '#4ECDC4', '#FF9F1C'],
  },
  startButton: {
    image: '/images/go-btn.png',
    label: 'GO',
    ariaLabel: '点击社团LOGO按钮开始抽卡',
    background: '#ffffff',
    borderColor: '#ffffff',
    textColor: '#1f2937',
    shadow: '0 14px 30px rgba(82, 62, 20, 0.24)',
  },
  wheel: {
    colors: ['#FF6B6B', '#FFD748', '#7C90FF', '#4ECDC4', '#FF9F1C'],
    labelColor: '#ffffff',
    hubColor: '#ffffff',
    pointerColor: '#ffffff',
  },
  audio: {
    spin: '/audio/spin.mp3',
    bgm: ['/audio/bgm1.mp3', '/audio/bgm2.mp3', '/audio/bgm3.mp3'],
  },
  cards: defaultCards,
};
