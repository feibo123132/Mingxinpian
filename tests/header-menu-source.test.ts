import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

test('App renders a single header menu instead of separate settings and theme buttons', () => {
  assert.match(appSource, /import HeaderMenu from '\.\/components\/HeaderMenu';/);
  assert.doesNotMatch(appSource, /import ThemeSwitcher/);
  assert.doesNotMatch(appSource, /import \{ Settings \} from 'lucide-react';/);
  assert.match(appSource, /<HeaderMenu[\s\S]+onOpenSettings=\{\(\) => setIsSettingsModalOpen\(true\)\}/);
});

test('HeaderMenu contains both actions under one menu trigger', () => {
  const menuSource = readFileSync(new URL('../src/components/HeaderMenu.tsx', import.meta.url), 'utf8');

  assert.match(menuSource, /Menu/);
  assert.match(menuSource, /编辑明信片/);
  assert.match(menuSource, /主题切换/);
  assert.match(menuSource, /themes\.map/);
});

test('HeaderMenu does not duplicate the active theme summary above the actions', () => {
  const menuSource = readFileSync(new URL('../src/components/HeaderMenu.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(menuSource, /当前主题/);
  assert.doesNotMatch(menuSource, /activeTheme\.preview\.label/);
});

test('HeaderMenu keeps theme options collapsed by default', () => {
  const menuSource = readFileSync(new URL('../src/components/HeaderMenu.tsx', import.meta.url), 'utf8');

  assert.match(menuSource, /const \[themesOpen, setThemesOpen\] = useState\(false\)/);
  assert.match(menuSource, /setThemesOpen\(\(value\) => !value\)/);
  assert.match(menuSource, /\{themesOpen \? \(/);
});

test('HeaderMenu uses a narrower menu and removes top-level action subtitles', () => {
  const menuSource = readFileSync(new URL('../src/components/HeaderMenu.tsx', import.meta.url), 'utf8');
  const topActionsSource = menuSource.split('{themesOpen ? (')[0];

  assert.match(menuSource, /w-44/);
  assert.doesNotMatch(menuSource, /w-72/);
  assert.doesNotMatch(topActionsSource, /text-xs text-gray-500/);
});
