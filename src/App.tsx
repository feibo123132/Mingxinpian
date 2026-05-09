import { useEffect, useMemo, useState } from 'react';
import BgmController from './components/BgmController';
import HeaderMenu from './components/HeaderMenu';
import ResultModal from './components/ResultModal';
import SettingsModal from './components/SettingsModal';
import Wheel from './components/Wheel';
import useLocalStorage from './hooks/useLocalStorage';
import { resolveAssetPath } from './lib/assetPaths';
import { ACTIVE_THEME_STORAGE_KEY, MAX_POSTCARDS, loadCardsForTheme, saveCardsForTheme } from './themes/storage';
import { DEFAULT_THEME_ID, builtinThemes, getThemeById } from './themes';
import type { Postcard } from './themes';

function App() {
  const [activeThemeId, setActiveThemeId] = useLocalStorage<string>(ACTIVE_THEME_STORAGE_KEY, DEFAULT_THEME_ID);
  const activeTheme = getThemeById(activeThemeId);
  const [cards, setCards] = useState<Postcard[]>(() => loadCardsForTheme(activeTheme.id, activeTheme.cards));
  const [selectedCard, setSelectedCard] = useState<Postcard | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [spinRequestId, setSpinRequestId] = useState(0);

  useEffect(() => {
    if (activeTheme.id !== activeThemeId) {
      setActiveThemeId(activeTheme.id);
    }
  }, [activeTheme.id, activeThemeId, setActiveThemeId]);

  useEffect(() => {
    setCards(loadCardsForTheme(activeTheme.id, activeTheme.cards));
    setSelectedCard(null);
    setIsResultModalOpen(false);
  }, [activeTheme]);

  useEffect(() => {
    try {
      cards.slice(0, MAX_POSTCARDS).forEach((card) => {
        if (!card.image) return;
        const image = new Image();
        image.decoding = 'async';
        image.loading = 'eager';
        image.src = resolveAssetPath(card.image);
      });
    } catch {
      // Image preloading is an enhancement; rendering can continue without it.
    }
  }, [cards]);

  const handleSpinComplete = (card: Postcard) => {
    setSelectedCard(card);
    setIsResultModalOpen(true);
  };

  const handleSpinAgain = () => {
    setIsResultModalOpen(false);
    setSelectedCard(null);
    setSpinRequestId((requestId) => requestId + 1);
  };

  const handleSaveCards = (newCards: Postcard[]) => {
    const nextCards = newCards.slice(0, MAX_POSTCARDS);
    setCards(nextCards);
    saveCardsForTheme(activeTheme.id, nextCards);
  };

  const wheelCards = useMemo(() => cards.slice(0, MAX_POSTCARDS), [cards]);

  return (
    <div
      className="flex min-h-screen flex-col items-center p-4 transition-colors duration-500"
      style={{ background: activeTheme.background, color: activeTheme.bodyColor }}
    >
      <div className="app-container flex min-h-[calc(100vh-2rem)] w-full flex-col items-center">
        <header className="relative w-full max-w-md pt-5">
          <BgmController tracks={activeTheme.audio.bgm} accentColor={activeTheme.accentColor} />

          <HeaderMenu
            themes={builtinThemes}
            activeTheme={activeTheme}
            onSelectTheme={setActiveThemeId}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
          />

          <div className="mb-2 flex items-center justify-center gap-2 px-20 text-center">
            <span role="img" aria-label={activeTheme.shortName} className="text-3xl">
              {activeTheme.icon}
            </span>
            <h1 className="text-3xl font-bold" style={{ color: activeTheme.titleColor }}>
              {activeTheme.title}
            </h1>
          </div>
          <p className="text-center text-base" style={{ color: activeTheme.bodyColor }}>
            {activeTheme.subtitle}
          </p>
        </header>

        <main className="flex w-full max-w-sm flex-1 items-center justify-center py-8">
          <Wheel
            cards={wheelCards}
            theme={activeTheme}
            spinRequestId={spinRequestId}
            onSpinComplete={handleSpinComplete}
          />
        </main>

        <ResultModal
          card={selectedCard}
          theme={activeTheme}
          isOpen={isResultModalOpen}
          onClose={() => setIsResultModalOpen(false)}
          onSpinAgain={handleSpinAgain}
        />

        <SettingsModal
          isOpen={isSettingsModalOpen}
          theme={activeTheme}
          cards={wheelCards}
          onClose={() => setIsSettingsModalOpen(false)}
          onSave={handleSaveCards}
        />

        <footer className="w-full pb-8 text-center text-sm" style={{ color: activeTheme.mutedColor }}>
          <p>{activeTheme.footer}</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
