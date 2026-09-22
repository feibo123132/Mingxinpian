import { christmasTheme } from './christmas.ts';
import { summerTheme } from './summer.ts';
import { adventureTheme } from './adventure.ts';
import { relaxedTheme } from './relaxed.ts';
import type { AppTheme } from './types.ts';

export type { AppTheme, Postcard } from './types.ts';

export const DEFAULT_THEME_ID = 'christmas';

export const builtinThemes: AppTheme[] = [christmasTheme, summerTheme, adventureTheme, relaxedTheme];

export const getThemeById = (themeId: string | null | undefined): AppTheme => {
  return builtinThemes.find((theme) => theme.id === themeId) ?? christmasTheme;
};
