import { useEffect, useMemo, useState } from 'react';
import BgmController from './components/BgmController';
import HeaderMenu from './components/HeaderMenu';
import ResultModal from './components/ResultModal';
import SettingsModal from './components/SettingsModal';
import Wheel from './components/Wheel';
import MultiplayerMode, { PlayerCountDialog } from './components/MultiplayerMode';
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
  const [multiplayerCount, setMultiplayerCount] = useState<number | null>(null);
  const [showPlayerCount, setShowPlayerCount] = useState(false);
  const [multiplayerSession, setMultiplayerSession] = useState(0);

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
        if (card.video) {
          const video = document.createElement('video');
          video.preload = 'auto';
          video.src = resolveAssetPath(card.video);
        }
        if (!card.image) return;
        const image = new Image();
        image.decoding = 'async';
        image.loading = 'eager';
        image.src = resolveAssetPath(card.image);
      });
    } catch {
      // Preloading is an enhancement; rendering can continue without it.
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

  const isAdventure = activeTheme.id === 'adventure';
  const multipleWheels = isAdventure && (multiplayerCount ?? 1) > 1;
  const wheelCards = useMemo(() => cards.slice(0, MAX_POSTCARDS), [cards]);

  return (
    <div
      className="flex min-h-screen flex-col items-center p-4 transition-colors duration-500"
      style={{ background: activeTheme.background, color: activeTheme.bodyColor }}
    >
      <div className="app-container flex min-h-[calc(100vh-2rem)] w-full flex-col items-center" style={multipleWheels ? { maxWidth: '1152px' } : undefined}>
        <header className={`relative w-full pt-5 ${!multipleWheels ? 'max-w-md' : ''}`}>
          <BgmController tracks={activeTheme.audio.bgm} accentColor={activeTheme.accentColor} />

          <HeaderMenu
            themes={builtinThemes}
            activeTheme={activeTheme}
            onSelectTheme={(id) => { setActiveThemeId(id); setMultiplayerCount(null); setMultiplayerSession(value => value + 1); }}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onOpenMultiplayer={() => setShowPlayerCount(true)}
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

        {isAdventure ? (
          <MultiplayerMode key={multiplayerSession} theme={activeTheme} initialCount={multiplayerCount ?? 1} onExit={() => { setMultiplayerCount(1); setMultiplayerSession(value => value + 1); }} />
        ) : <main className="flex w-full max-w-sm flex-1 items-center justify-center py-8">
          <Wheel
            cards={wheelCards}
            theme={activeTheme}
            spinRequestId={spinRequestId}
            onSpinComplete={handleSpinComplete}
          />
        </main>}

        {showPlayerCount && <PlayerCountDialog initialCount={multiplayerCount ?? 1} onClose={() => setShowPlayerCount(false)} onConfirm={count => {
          setActiveThemeId('adventure');
          setMultiplayerCount(count);
          setMultiplayerSession(session => session + 1);
          setShowPlayerCount(false);
          setIsResultModalOpen(false);
        }} />}

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
