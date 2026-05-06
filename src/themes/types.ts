export interface Postcard {
  id: string;
  title: string;
  content: string;
  image: string;
  sound: string;
}

export interface ThemePreview {
  colors: string[];
  label: string;
}

export interface ThemeStartButton {
  image?: string;
  label: string;
  sublabel?: string;
  ariaLabel: string;
  background: string;
  borderColor: string;
  textColor: string;
  shadow: string;
}

export interface WheelTheme {
  colors: string[];
  labelColor: string;
  hubColor: string;
  pointerColor: string;
}

export interface ThemeAudio {
  spin: string;
  bgm: string[];
}

export interface AppTheme {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  title: string;
  subtitle: string;
  footer: string;
  background: string;
  surface: string;
  titleColor: string;
  bodyColor: string;
  mutedColor: string;
  accentColor: string;
  accentTextColor: string;
  settingsIcon: string;
  preview: ThemePreview;
  startButton: ThemeStartButton;
  wheel: WheelTheme;
  audio: ThemeAudio;
  cards: Postcard[];
}
