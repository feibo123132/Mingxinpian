import { christmasTheme } from './christmas.ts';
import { summerTheme } from './summer.ts';
import { adventureTheme } from './adventure.ts';
import { adventure2Theme } from './adventure2.ts';
import { relaxedTheme } from './relaxed.ts';
import type { AppTheme } from './types.ts';

export type { AppTheme, Postcard } from './types.ts';

export const DEFAULT_THEME_ID = 'christmas';

export const builtinThemes: AppTheme[] = [christmasTheme, summerTheme, adventureTheme, adventure2Theme, relaxedTheme];

export const isAdventureTheme = (themeId: string) => themeId === 'adventure' || themeId === 'adventure-2';

export const getThemeById = (themeId: string | null | undefined): AppTheme => {
  return builtinThemes.find((theme) => theme.id === themeId) ?? christmasTheme;
};
