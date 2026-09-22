import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronRight, Menu, Palette, Settings, Users, X } from 'lucide-react';
import type { AppTheme } from '../themes';

interface HeaderMenuProps {
  themes: AppTheme[];
  activeTheme: AppTheme;
  onSelectTheme: (themeId: string) => void;
  onOpenSettings: () => void;
  onOpenMultiplayer: () => void;
}

const HeaderMenu: React.FC<HeaderMenuProps> = ({ themes, activeTheme, onSelectTheme, onOpenSettings, onOpenMultiplayer }) => {
  const [open, setOpen] = useState(false);
  const [themesOpen, setThemesOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!themesOpen) return;
    const dialog = dialogRef.current;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      menuButtonRef.current?.focus();
    };
  }, [themesOpen]);
  const rootRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => {
    setOpen(false);
    setThemesOpen(false);
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  const handleToggleMenu = () => {
    setOpen((value) => {
      if (value) setThemesOpen(false);
      return !value;
    });
  };

  const handleOpenSettings = () => {
    onOpenSettings();
    closeMenu();
  };

  const handleSelectTheme = (themeId: string) => {
    onSelectTheme(themeId);
    closeMenu();
  };

  return (
    <div ref={rootRef} className="absolute right-0 top-0 z-20">
      <button
        ref={menuButtonRef}
        onClick={handleToggleMenu}
        className="flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-transform duration-200 hover:scale-105"
        style={{ background: activeTheme.surface, color: activeTheme.titleColor }}
        aria-label="打开菜单"
        title="菜单"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open ? (
        <div className="absolute right-0 mt-3 w-44 overflow-hidden rounded-2xl bg-white text-left shadow-2xl ring-1 ring-black/5">
          <button
            onClick={handleOpenSettings}
            className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700">
              <Settings className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 text-sm font-semibold text-gray-800">编辑明信片</span>
          </button>

          <button
            onClick={() => { setOpen(false); setThemesOpen(true); }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
            aria-haspopup="dialog"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700">
              <Palette className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-gray-800">主题切换</span><span className="mt-0.5 block truncate text-xs text-gray-400">{activeTheme.name}</span></span>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
          </button>

          <button
            onClick={() => { onOpenMultiplayer(); closeMenu(); }}
            className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700"><Users className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1 text-sm font-semibold text-gray-800">多个转盘</span>
          </button>
        </div>
      ) : null}
      {themesOpen && <dialog ref={dialogRef} aria-labelledby="theme-picker-title" onCancel={(event) => { event.preventDefault(); setThemesOpen(false); }}
        onClick={(event) => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) setThemesOpen(false); } }}
        className="m-auto w-[calc(100%_-_2rem)] max-w-2xl overflow-hidden rounded-[2rem] border border-white bg-[#fffdf7] p-0 text-left text-gray-800 shadow-2xl backdrop:bg-black/35 backdrop:backdrop-blur-sm">
        <div className="flex max-h-[85dvh] flex-col">
          <header className="flex shrink-0 items-start justify-between gap-4 px-6 pb-5 pt-6 sm:px-8 sm:pt-8">
            <div><p className="mb-2 text-[10px] font-bold tracking-[.25em] text-amber-700/60">CHOOSE YOUR MOOD</p><h2 id="theme-picker-title" className="text-2xl font-bold">换个主题，换种心情</h2><p className="mt-2 text-sm text-gray-500">选择你想开启的世界</p></div>
            <button type="button" aria-label="关闭主题选择" onClick={() => setThemesOpen(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/5 text-gray-500 hover:bg-black/10"><X size={18} /></button>
          </header>
          <div className="grid min-h-0 grid-cols-2 gap-3 overflow-y-auto px-6 pb-6 sm:grid-cols-3 sm:gap-4 sm:px-8 sm:pb-8">
            {themes.map((theme) => {
              const selected = theme.id === activeTheme.id;
              return <button type="button" key={theme.id} aria-pressed={selected} onClick={() => handleSelectTheme(theme.id)}
                className="relative flex min-h-40 flex-col items-start rounded-2xl border-2 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
                style={{ background: theme.background, borderColor: selected ? theme.accentColor : 'transparent' }}>
                {selected && <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-white/90" style={{ color: theme.titleColor }}><Check size={15} /></span>}
                <span className="mb-4 text-3xl" aria-hidden="true">{theme.icon}</span>
                <strong className="text-sm sm:text-base" style={{ color: theme.titleColor }}>{theme.name}</strong>
                <span className="mt-auto flex flex-wrap gap-1 pt-4" aria-hidden="true">{theme.preview.colors.map((color, index) => <span key={index} className="h-2 w-4 rounded-full" style={{ background: color }} />)}</span>
              </button>;
            })}
          </div>
        </div>
      </dialog>}
    </div>
  );
};

export default HeaderMenu;
