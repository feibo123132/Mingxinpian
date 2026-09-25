import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import BgmController from './components/BgmController';
import HeaderMenu from './components/HeaderMenu';
import ResultModal, { type CardPlaybackState } from './components/ResultModal';
import SettingsModal from './components/SettingsModal';
import RelaxedPairEditor from './components/RelaxedPairEditor';
import Wheel, { type WheelHandle } from './components/Wheel';
import MultiplayerMode, { PlayerCountDialog } from './components/MultiplayerMode';
import useLocalStorage from './hooks/useLocalStorage';
import { resolveAssetPath } from './lib/assetPaths';
import { collectCard, consumeCard, type CardBox } from './lib/cardBox';
import { fixedModes } from './lib/fixedModes';
import { getRelaxedAudioPairForDraw, loadRelaxedAudioPairs, saveRelaxedAudioPairs, type RelaxedAudioPair } from './lib/relaxedAudioPairs';
import { ACTIVE_THEME_STORAGE_KEY, MAX_POSTCARDS, loadCardsForTheme, saveCardsForTheme } from './themes/storage';
import { DEFAULT_THEME_ID, builtinThemes, getThemeById } from './themes';
import type { Postcard } from './themes';

function App() {
  const [activeThemeId, setActiveThemeId] = useLocalStorage<string>(ACTIVE_THEME_STORAGE_KEY, DEFAULT_THEME_ID);
  const activeTheme = getThemeById(activeThemeId);
  const [cards, setCards] = useState<Postcard[]>(() => loadCardsForTheme(activeTheme.id, activeTheme.cards));
  const [selectedCard, setSelectedCard] = useState<Postcard | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [playbackState, setPlaybackState] = useState<CardPlaybackState>('ready');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [spinRequestId, setSpinRequestId] = useState(0);
  const wheelRef = useRef<WheelHandle>(null);
  const popAudio = useRef<HTMLAudioElement | null>(null);
  const [multiplayerCount, setMultiplayerCount] = useState<number | null>(null);
  const [showPlayerCount, setShowPlayerCount] = useState(false);
  const [multiplayerSession, setMultiplayerSession] = useState(0);
  const [cardBox, setCardBox] = useState<CardBox>({});
  const [fixedModeId, setFixedModeId] = useState<string | null>(null);
  const fixedMode = fixedModes.find(mode => mode.id === fixedModeId) ?? null;
  const [relaxedPairs, setRelaxedPairs] = useState<RelaxedAudioPair[]>(loadRelaxedAudioPairs);
  const [relaxedPairsEnabled, setRelaxedPairsEnabled] = useLocalStorage('relaxed-audio-pairs:enabled:v1', false);
  const [isPairEditorOpen, setIsPairEditorOpen] = useState(false);
  const [relaxedDrawCount, setRelaxedDrawCount] = useState(0);
  const [wheelSession, setWheelSession] = useState(0);

  useEffect(() => {
    if (activeTheme.id !== activeThemeId) {
      setActiveThemeId(activeTheme.id);
    }
  }, [activeTheme.id, activeThemeId, setActiveThemeId]);

  useEffect(() => {
    const audio = new Audio(resolveAssetPath('/audio/pop.mp3'));
    audio.preload = 'auto';
    popAudio.current = audio;
    return () => {
      audio.pause();
      popAudio.current = null;
    };
  }, []);

  useEffect(() => {
    setCards(loadCardsForTheme(activeTheme.id, activeTheme.cards));
    setSelectedCard(null);
    setIsResultModalOpen(false);
    setPlaybackState('ready');
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
    if (activeTheme.id === 'relaxed' && relaxedPairsEnabled && relaxedPairs.length && card.id.startsWith('relaxed-')) {
      setRelaxedDrawCount(count => count + 1);
    }
    setSelectedCard(card);
    setIsResultModalOpen(true);
    setPlaybackState('ready');
  };

  const handleSpinAgain = () => {
    setIsResultModalOpen(false);
    setSelectedCard(null);
    setPlaybackState('ready');
    setSpinRequestId((requestId) => requestId + 1);
  };

  const handleSaveCards = (newCards: Postcard[]) => {
    const nextCards = newCards.slice(0, MAX_POSTCARDS);
    setCards(nextCards);
    saveCardsForTheme(activeTheme.id, nextCards);
  };

  const restartCardAudio = () => {
    setPlaybackState('playing');
    if (!wheelRef.current?.replayCardAudio()) setPlaybackState('ready');
  };

  const isAdventure = activeTheme.id === 'adventure';
  const multipleWheels = isAdventure && (multiplayerCount ?? 1) > 1;
  const wheelCards = useMemo(() => cards.slice(0, MAX_POSTCARDS), [cards]);
  const currentRelaxedPair = relaxedPairsEnabled && activeTheme.id === 'relaxed'
    ? getRelaxedAudioPairForDraw(relaxedPairs, relaxedDrawCount)
    : null;
  const takeRelaxedBonusPair = () => {
    if (!relaxedPairsEnabled) return null;
    const pair = getRelaxedAudioPairForDraw(relaxedPairs, relaxedDrawCount);
    if (pair) setRelaxedDrawCount(count => count + 1);
    return pair;
  };
  const startFixedMode = (modeId: string) => {
    const mode = fixedModes.find(item => item.id === modeId);
    if (!mode || mode.kind !== 'sequence') return;
    setActiveThemeId(mode.themeId);
    setFixedModeId(modeId);
    setMultiplayerCount(mode.themeId === 'adventure' ? 1 : null);
    setCardBox({});
    setMultiplayerSession(value => value + 1);
    setWheelSession(value => value + 1);
    setSelectedCard(null);
    setIsResultModalOpen(false);
  };

  const playControlPop = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const control = target.closest('button, a[href], [role="button"]');
    if (!control || !event.currentTarget.contains(control) || control.matches(':disabled, [aria-disabled="true"]')) return;
    const audio = popAudio.current;
    if (!audio) return;
    try {
      audio.currentTime = 0;
      void audio.play().catch(() => {});
    } catch {
      // Audio playback may be unavailable; the button action still works.
    }
  };

  return (
    <div
      onClickCapture={playControlPop}
      className="flex min-h-screen flex-col items-center p-4 transition-colors duration-500"
      style={{ background: activeTheme.background, color: activeTheme.bodyColor }}
    >
      <div className="app-container flex min-h-[calc(100vh-2rem)] w-full flex-col items-center" style={multipleWheels ? { maxWidth: '1152px' } : undefined}>
        <header className={`relative w-full pt-5 ${!multipleWheels ? 'max-w-md' : ''}`}>
          <BgmController tracks={activeTheme.audio.bgm} accentColor={activeTheme.accentColor} />

          <HeaderMenu
            themes={builtinThemes}
            activeTheme={activeTheme}
            onSelectTheme={(id) => { setActiveThemeId(id); setFixedModeId(null); setCardBox({}); setMultiplayerCount(null); setMultiplayerSession(value => value + 1); setWheelSession(value => value + 1); }}
            activeFixedModeId={fixedModeId}
            onSelectFixedMode={startFixedMode}
            onExitFixedMode={() => { setFixedModeId(null); setCardBox({}); setMultiplayerSession(value => value + 1); setWheelSession(value => value + 1); }}
            relaxedPairCount={relaxedPairs.length}
            relaxedPairsEnabled={relaxedPairsEnabled && relaxedPairs.length > 0}
            onToggleRelaxedPairs={() => {
              if (!relaxedPairs.length) { setIsPairEditorOpen(true); return; }
              setRelaxedPairsEnabled(enabled => !enabled);
            }}
            onOpenPairEditor={() => setIsPairEditorOpen(true)}
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
          <MultiplayerMode key={multiplayerSession} theme={activeTheme} initialCount={multiplayerCount ?? 1} fixedMode={fixedMode?.kind === 'sequence' ? fixedMode : null} cardBox={cardBox} onCollectCard={cardId => setCardBox(box => collectCard(box, cardId))} onConsumeCard={cardId => setCardBox(box => consumeCard(box, cardId))} onTakeRelaxedBonusPair={takeRelaxedBonusPair} onRestartFixedMode={() => { setCardBox({}); setMultiplayerSession(value => value + 1); }} onExit={() => { setMultiplayerCount(1); setMultiplayerSession(value => value + 1); }} />
        ) : <main className="flex w-full max-w-sm flex-1 items-center justify-center py-8">
          <div className="flex w-full flex-col items-center">
          <Wheel
            key={`${activeTheme.id}-${wheelSession}`}
            ref={wheelRef}
            cards={wheelCards}
            theme={activeTheme}
            spinRequestId={spinRequestId}
            fixedAudioPair={currentRelaxedPair}
            onSpinComplete={handleSpinComplete}
            onCardAudioStarted={() => setPlaybackState('playing')}
            onCardAudioFinished={() => setPlaybackState('ready')}
          />
          </div>
        </main>}

        {showPlayerCount && <PlayerCountDialog initialCount={multiplayerCount ?? 1} onClose={() => setShowPlayerCount(false)} onConfirm={count => {
          setActiveThemeId('adventure');
          setFixedModeId(null);
          setCardBox({});
          setMultiplayerCount(count);
          setMultiplayerSession(session => session + 1);
          setShowPlayerCount(false);
          setIsResultModalOpen(false);
        }} />}

        <ResultModal
          card={selectedCard}
          theme={activeTheme}
          isOpen={isResultModalOpen}
          onClose={() => {
            setIsResultModalOpen(false);
            setPlaybackState('ready');
            wheelRef.current?.stopCardAudio();
          }}
          onRestart={restartCardAudio}
          onTogglePlayback={() => {
            if (playbackState === 'playing') {
              if (wheelRef.current?.pauseCardAudio()) setPlaybackState('paused');
            } else if (playbackState === 'paused') {
              setPlaybackState('playing');
              if (!wheelRef.current?.resumeCardAudio()) setPlaybackState('ready');
            } else {
              restartCardAudio();
            }
          }}
          playbackState={playbackState}
          onSpinAgain={handleSpinAgain}
        />

        <SettingsModal
          isOpen={isSettingsModalOpen}
          theme={activeTheme}
          cards={wheelCards}
          onClose={() => setIsSettingsModalOpen(false)}
          onSave={handleSaveCards}
        />

        <RelaxedPairEditor isOpen={isPairEditorOpen} pairs={relaxedPairs} onClose={() => setIsPairEditorOpen(false)} onSave={draft => {
          const saved = saveRelaxedAudioPairs(draft);
          setRelaxedPairs(saved);
          setIsPairEditorOpen(false);
          setRelaxedDrawCount(0);
          setRelaxedPairsEnabled(saved.length > 0);
        }} />

        <footer className="w-full pb-8 text-center text-sm" style={{ color: activeTheme.mutedColor }}>
          <p>{activeTheme.footer}</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
