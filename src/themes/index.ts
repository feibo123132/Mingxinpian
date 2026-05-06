import { christmasTheme } from './christmas.ts';
import { summerTheme } from './summer.ts';
import type { AppTheme } from './types.ts';

export type { AppTheme, Postcard } from './types.ts';

export const DEFAULT_THEME_ID = 'christmas';

export const builtinThemes: AppTheme[] = [christmasTheme, summerTheme];

export const getThemeById = (themeId: string | null | undefined): AppTheme => {
  return builtinThemes.find((theme) => theme.id === themeId) ?? christmasTheme;
};
