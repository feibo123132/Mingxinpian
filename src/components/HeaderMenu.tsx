import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronUp, Menu, Palette, Settings } from 'lucide-react';
import type { AppTheme } from '../themes';

interface HeaderMenuProps {
  themes: AppTheme[];
  activeTheme: AppTheme;
  onSelectTheme: (themeId: string) => void;
  onOpenSettings: () => void;
}

const HeaderMenu: React.FC<HeaderMenuProps> = ({ themes, activeTheme, onSelectTheme, onOpenSettings }) => {
  const [open, setOpen] = useState(false);
  const [themesOpen, setThemesOpen] = useState(false);
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
            onClick={() => setThemesOpen((value) => !value)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
            aria-expanded={themesOpen}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700">
              <Palette className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 text-sm font-semibold text-gray-800">主题切换</span>
            {themesOpen ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
            )}
          </button>

          {themesOpen ? (
            <div className="space-y-2 border-t border-gray-100 px-3 pb-3 pt-2">
              {themes.map((theme) => {
                const selected = theme.id === activeTheme.id;

                return (
                  <button
                    key={theme.id}
                    onClick={() => handleSelectTheme(theme.id)}
                    className="flex w-full items-center gap-2 rounded-xl border p-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                    style={{
                      borderColor: selected ? theme.accentColor : '#e5e7eb',
                      background: selected ? '#fffaf0' : '#ffffff',
                    }}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
                      style={{ background: theme.background }}
                    >
                      {theme.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm font-bold text-gray-800">
                        {theme.name}
                        {selected ? <Check className="h-4 w-4" style={{ color: theme.accentColor }} /> : null}
                      </span>
                      <span className="mt-2 flex gap-1">
                        {theme.preview.colors.map((color) => (
                          <span key={color} className="h-2 w-4 rounded-full" style={{ background: color }} />
                        ))}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default HeaderMenu;
