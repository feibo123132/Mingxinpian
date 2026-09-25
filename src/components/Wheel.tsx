import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { resolveAssetPath } from '../lib/assetPaths';
import { pickOptionalCardMusic } from '../lib/availableCardMusic';
import { selectCardSound } from '../lib/relaxedCardAudio';
import { pausePendingCardAudio, resumePendingCardAudio } from '../lib/cardAudioControls';
import { WHEEL_GRADIENT_START_OFFSET, getWheelSelectedIndex, getRestrictedWheelRotation } from '../lib/wheelSelection';
import type { RelaxedAudioPair } from '../lib/relaxedAudioPairs';
import { useAudioBus } from '../store/audioBus';
import type { AppTheme, Postcard } from '../themes';

interface WheelProps {
  cards: Postcard[];
  theme: AppTheme;
  spinRequestId?: number;
  fixedAudioPair?: RelaxedAudioPair | null;
  onSpinComplete: (card: Postcard) => void;
  onCardAudioStarted: () => void;
  onCardAudioFinished: () => void;
}

export interface WheelHandle {
  replayCardAudio: () => boolean;
  pauseCardAudio: () => boolean;
  resumeCardAudio: () => boolean;
  stopCardAudio: () => void;
}

const Wheel = React.forwardRef<WheelHandle, WheelProps>(function Wheel({ cards, theme, spinRequestId = 0, fixedAudioPair, onSpinComplete, onCardAudioStarted, onCardAudioFinished }, ref) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [startImageSrc, setStartImageSrc] = useState('');
  const [startImageFallbackTried, setStartImageFallbackTried] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const resultAudioRef = useRef<HTMLAudioElement | null>(null);
  const backingAudioRef = useRef<HTMLAudioElement | null>(null);
  const pendingCardAudioRef = useRef<Set<HTMLAudioElement> | null>(null);
  const lastCardAudioRef = useRef<{ card: Postcard; voiceSrc: string; backingSound: string | null } | null>(null);
  const resultAudioActiveRef = useRef(false);
  const resultExclusiveRef = useRef(false);
  const resultSequenceRef = useRef(0);
  const spinAudioActiveRef = useRef(false);
  const lastHandledSpinRequestRef = useRef(spinRequestId);

  const fallbackStartImage = useMemo(() => resolveAssetPath('/images/go-btn.png'), []);

  const startAudioEffect = useCallback(() => {
    try {
      useAudioBus.getState().startEffect();
    } catch {
      // Audio bus failures should not block the wheel interaction.
    }
  }, []);

  const endAudioEffect = useCallback(() => {
    try {
      useAudioBus.getState().endEffect();
    } catch {
      // Audio bus failures should not block the wheel interaction.
    }
  }, []);

  const markSpinAudioStarted = useCallback(() => {
    if (spinAudioActiveRef.current) return;

    spinAudioActiveRef.current = true;
    startAudioEffect();
  }, [startAudioEffect]);

  const markSpinAudioEnded = useCallback(() => {
    if (!spinAudioActiveRef.current) return;

    spinAudioActiveRef.current = false;
    endAudioEffect();
  }, [endAudioEffect]);

  const createResultAudio = useCallback((card: Postcard, selectedSound?: string) => {
    const audio = new Audio(resolveAssetPath(selectedSound || card.sound || '/audio/card1.mp3'));
    audio.preload = 'auto';
    audio.loop = false;
    return audio;
  }, []);

  const stopResultAudio = useCallback(() => {
    resultSequenceRef.current += 1;
    pendingCardAudioRef.current = null;
    for (const audio of [resultAudioRef.current, backingAudioRef.current]) {
      if (!audio) continue;
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.onended = null;
        audio.onerror = null;
      } catch {
        // Ignore browsers that reject resetting an unloaded audio element.
      }
    }
    resultAudioRef.current = null;
    backingAudioRef.current = null;
    if (resultAudioActiveRef.current) {
      resultAudioActiveRef.current = false;
      endAudioEffect();
    }
    if (resultExclusiveRef.current) {
      resultExclusiveRef.current = false;
      useAudioBus.getState().endExclusive();
    }
  }, [endAudioEffect]);

  const prepareSelectedCardSound = useCallback((card: Postcard, selectedSound?: string) => {
    stopResultAudio();
    lastCardAudioRef.current = null;

    const resultAudio = createResultAudio(card, selectedSound);
    resultAudioRef.current = resultAudio;

    try {
      resultAudio.muted = true;
      resultAudio.volume = 0;
      resultAudio
        .play()
        .then(() => {
          resultAudio.pause();
          resultAudio.currentTime = 0;
          resultAudio.muted = false;
          resultAudio.volume = 1;
        })
        .catch(() => {
          resultAudio.muted = false;
          resultAudio.volume = 1;
        });
    } catch {
      resultAudio.muted = false;
      resultAudio.volume = 1;
    }
  }, [createResultAudio, stopResultAudio]);

  const playSelectedCardSound = useCallback(async (
    card: Postcard,
    replay?: { voiceSrc: string; backingSound: string | null },
    selectedPair?: RelaxedAudioPair | null,
    selectedSoundForSpin?: string,
  ) => {
    const sequence = resultSequenceRef.current;
    let backingSound = replay?.backingSound ?? selectedPair?.music ?? null;
    if (!replay && !selectedPair) {
      try {
        backingSound = await pickOptionalCardMusic(card.id);
      } catch {
        // The card voice can still play when optional music cannot be checked.
      }
    }
    if (sequence !== resultSequenceRef.current) return;

    try {
      const selectedSound = replay?.voiceSrc ?? selectedPair?.sound ?? selectedSoundForSpin ?? await selectCardSound(theme.id, card);
      if (sequence !== resultSequenceRef.current) return;
      const preparedAudio = resultAudioRef.current;
      const selectionAudio = replay
        ? new Audio(replay.voiceSrc)
        : preparedAudio?.getAttribute('src') === resolveAssetPath(selectedSound)
          ? preparedAudio
          : createResultAudio(card, selectedSound);
      const backingAudio = backingSound ? new Audio(resolveAssetPath(backingSound)) : null;
      lastCardAudioRef.current = { card, voiceSrc: selectionAudio.src, backingSound };
      resultAudioRef.current = selectionAudio;
      backingAudioRef.current = backingAudio;
      const group = backingAudio ? [selectionAudio, backingAudio] : [selectionAudio];
      const pending = new Set(group);
      pendingCardAudioRef.current = pending;

      startAudioEffect();
      resultAudioActiveRef.current = true;
      onCardAudioStarted();
      if (backingAudio) {
        useAudioBus.getState().startExclusive();
        resultExclusiveRef.current = true;
        backingAudio.volume = 0.6;
      }

      group.forEach(audio => {
        const finished = () => {
          if (sequence !== resultSequenceRef.current || !pending.delete(audio)) return;
          audio.onended = null;
          audio.onerror = null;
          if (pending.size === 0) {
            stopResultAudio();
            onCardAudioFinished();
          }
        };
        audio.onended = finished;
        audio.onerror = finished;
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
        if (audio === selectionAudio) audio.volume = 1;
        try { void audio.play().catch(finished); } catch { finished(); }
      });
    } catch {
      stopResultAudio();
      onCardAudioFinished();
    }
  }, [createResultAudio, onCardAudioFinished, onCardAudioStarted, startAudioEffect, stopResultAudio, theme.id]);

  React.useImperativeHandle(ref, () => ({
    replayCardAudio: () => {
      const last = lastCardAudioRef.current;
      if (!last) return false;
      stopResultAudio();
      void playSelectedCardSound(last.card, last);
      return true;
    },
    pauseCardAudio: () => {
      return pausePendingCardAudio(pendingCardAudioRef.current);
    },
    resumeCardAudio: () => {
      return resumePendingCardAudio(pendingCardAudioRef.current);
    },
    stopCardAudio: () => {
      stopResultAudio();
      lastCardAudioRef.current = null;
    },
  }), [playSelectedCardSound, stopResultAudio]);

  const startSpinAudio = useCallback(() => {
    const spinAudio = audioRef.current;
    if (!spinAudio) return;

    try {
      if (spinAudioActiveRef.current) {
        markSpinAudioEnded();
      }

      spinAudio.pause();
      spinAudio.currentTime = 0;
      spinAudio.loop = true;
      spinAudio.volume = 0.9;
      spinAudio.onended = null;
      spinAudio.onerror = null;
      spinAudio.play().catch(() => markSpinAudioEnded());
      markSpinAudioStarted();
    } catch {
      markSpinAudioEnded();
    }
  }, [markSpinAudioEnded, markSpinAudioStarted]);

  const finishSpinAudioLoop = useCallback((onFinished?: () => void) => {
    const spinAudio = audioRef.current;
    if (!spinAudio || !spinAudioActiveRef.current) { onFinished?.(); return; }

    spinAudio.loop = false;
    spinAudio.onended = () => {
      markSpinAudioEnded();

      try {
        spinAudio.currentTime = 0;
      } catch {
        // Ignore browsers that reject resetting an unloaded audio element.
      }

      spinAudio.onended = null;
      spinAudio.onerror = null;
      onFinished?.();
    };
    spinAudio.onerror = () => {
      spinAudio.onended = null;
      spinAudio.onerror = null;
      markSpinAudioEnded();
      onFinished?.();
    };
  }, [markSpinAudioEnded]);

  useEffect(() => {
    const audio = new Audio(resolveAssetPath(theme.audio.spin));
    audio.preload = 'auto';
    audio.loop = true;
    audioRef.current = audio;

    return () => {
      try {
        audio.pause();
        audio.onended = null;
        audio.onerror = null;
      } catch {
        // Ignore browsers that reject resetting an unloaded audio element.
      }

      markSpinAudioEnded();
      stopResultAudio();
    };
  }, [markSpinAudioEnded, stopResultAudio, theme.audio.spin]);

  useEffect(() => {
    if (!theme.startButton.image) {
      setStartImageSrc('');
      setStartImageFallbackTried(false);
      return;
    }

    setStartImageSrc(resolveAssetPath(theme.startButton.image));
    setStartImageFallbackTried(false);
  }, [theme.startButton.image]);

  const spin = useCallback(() => {
    if (isSpinning || !cards.length) return;

    setIsSpinning(true);

    const minRotation = 1800;
    const maxRotation = 3000;
    const randomRotation = Math.floor(Math.random() * (maxRotation - minRotation + 1)) + minRotation;
    const finalRotation = theme.id === 'relaxed'
      ? getRestrictedWheelRotation(rotation, cards.length, 2)
      : rotation + randomRotation;
    const selectedIndex = getWheelSelectedIndex(finalRotation, cards.length);
    const selectedCard = cards[selectedIndex];
    let spinFinished = false;
    const selectedSoundPromise = fixedAudioPair?.sound
      ? Promise.resolve(fixedAudioPair.sound)
      : selectCardSound(theme.id, selectedCard);

    prepareSelectedCardSound(selectedCard, fixedAudioPair?.sound);
    void selectedSoundPromise.then(sound => {
      if (!spinFinished && sound !== (fixedAudioPair?.sound ?? selectedCard.sound)) {
        prepareSelectedCardSound(selectedCard, sound);
      }
    });
    startSpinAudio();

    setRotation(finalRotation);

    const endHandler = () => {
      spinFinished = true;
      setIsSpinning(false);

      const playWithSelectedSound = () => {
        const sequence = resultSequenceRef.current;
        void selectedSoundPromise.then(sound => {
          if (resultSequenceRef.current === sequence) {
            void playSelectedCardSound(selectedCard, undefined, fixedAudioPair, sound);
          }
        });
      };

      if (theme.id === 'relaxed') {
        finishSpinAudioLoop(playWithSelectedSound);
      } else {
        finishSpinAudioLoop();
        playWithSelectedSound();
      }
      onSpinComplete(selectedCard);
    };

    if (wheelRef.current) {
      wheelRef.current.addEventListener('transitionend', endHandler, { once: true });
    }
  }, [
    cards,
    fixedAudioPair,
    finishSpinAudioLoop,
    isSpinning,
    onSpinComplete,
    playSelectedCardSound,
    prepareSelectedCardSound,
    rotation,
    startSpinAudio,
    theme.id,
  ]);

  useEffect(() => {
    if (spinRequestId === lastHandledSpinRequestRef.current) return;

    lastHandledSpinRequestRef.current = spinRequestId;
    spin();
  }, [spinRequestId, spin]);

  const segmentAngle = cards.length ? 360 / cards.length : 360;
  const segmentColors =
    theme.wheel.colors.length >= cards.length
      ? theme.wheel.colors.slice(0, cards.length)
      : Array.from({ length: cards.length }, (_, index) => {
          const hue = Math.round((360 / cards.length) * index);
          return `hsl(${hue} 74% 64%)`;
        });
  const gradientStops = cards
    .map((_, index) => {
      const start = index * segmentAngle;
      const end = (index + 1) * segmentAngle;
      const color = segmentColors[index];
      return `${color} ${start}deg ${end}deg`;
    })
    .join(', ');

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative mb-8">
        <div
          ref={wheelRef}
          className="relative h-80 w-80 overflow-hidden rounded-full shadow-2xl transition-transform duration-[4000ms] ease-out"
          style={{
            transform: `rotate(${rotation}deg)`,
            willChange: 'transform',
            background: `conic-gradient(from -90deg, ${gradientStops})`,
          }}
        >
          {cards.map((card, index) => {
            const startAngle = index * segmentAngle;
            const endAngle = (index + 1) * segmentAngle;
            const midAngle = (startAngle + endAngle) / 2;
            const titleLen = card.title.length;
            const wheelSize = 320;
            const hub = 56;
            const margin = 10;
            const radiusPx = wheelSize / 2;
            const safeMinPct = ((hub / 2 + margin) / radiusPx) * 50;
            const safeMaxPct = 50 - (margin / radiusPx) * 50;
            const desiredPct = 50 * 0.6;
            const rPct = Math.min(safeMaxPct, Math.max(safeMinPct, desiredPct));
            const rPx = radiusPx * (rPct / 50);
            const labelRotation = (((midAngle + WHEEL_GRADIENT_START_OFFSET) % 360) + 360) % 360;
            const fs = titleLen >= 5 ? 14 : 16;

            return (
              <div
                key={card.id}
                className="absolute"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) rotate(${labelRotation}deg) translate(0, -${rPx}px)`,
                  transformOrigin: '50% 50%',
                }}
              >
                <div
                  style={{
                    alignItems: 'center',
                    color: theme.wheel.labelColor,
                    display: 'flex',
                    fontSize: `${fs}px`,
                    fontWeight: 800,
                    justifyContent: 'center',
                    lineHeight: 1.2,
                    padding: '2px',
                    textOrientation: 'upright',
                    textShadow: '0 1px 2px rgba(0,0,0,0.35)',
                    whiteSpace: 'nowrap',
                    writingMode: 'vertical-rl',
                  }}
                >
                  {card.title}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="absolute left-1/2 top-1/2" style={{ transform: 'translate(-50%, -50%)' }}>
            <div
              className="rounded-full shadow-md"
              style={{ width: '56px', height: '56px', background: theme.wheel.hubColor }}
            />
          </div>
          <div
            className="absolute left-1/2 top-1/2"
            style={{ transform: 'translate(-50%, -50%) translateY(-36px)' }}
          >
            <svg width="26" height="18" viewBox="0 0 26 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 0 L3 18 L23 18 Z" fill={theme.wheel.pointerColor} stroke="#e5e7eb" strokeWidth="1" />
            </svg>
          </div>
        </div>
      </div>

      <button
        onClick={spin}
        disabled={isSpinning}
        className={`animate-breath flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full border-4 shadow-lg transition-transform duration-200 ease-in-out ${
          isSpinning ? 'cursor-not-allowed opacity-70' : 'hover:scale-110 hover:brightness-110'
        }`}
        style={{
          background: theme.startButton.background,
          borderColor: theme.startButton.borderColor,
          boxShadow: theme.startButton.shadow,
          color: theme.startButton.textColor,
        }}
        aria-label={theme.startButton.ariaLabel}
      >
        {startImageSrc ? (
          <img
            src={startImageSrc}
            alt=""
            className="block h-full w-full object-contain p-1"
            onError={() => {
              if (!startImageFallbackTried) {
                setStartImageFallbackTried(true);
                setStartImageSrc(fallbackStartImage);
                return;
              }
              setStartImageSrc('');
            }}
          />
        ) : (
          <span className="flex flex-col items-center text-center font-black leading-none">
            <span className={theme.id === 'relaxed' ? 'text-[26px]' : 'text-xl'}>{theme.startButton.label}</span>
            {theme.startButton.sublabel ? (
              <span className="mt-1 text-[10px] font-bold">{theme.startButton.sublabel}</span>
            ) : null}
          </span>
        )}
      </button>
    </div>
  );
});

export default Wheel;
