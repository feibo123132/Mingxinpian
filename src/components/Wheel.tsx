import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { resolveAssetPath } from '../lib/assetPaths';
import { WHEEL_GRADIENT_START_OFFSET, getWheelSelectedIndex } from '../lib/wheelSelection';
import { useAudioBus } from '../store/audioBus';
import type { AppTheme, Postcard } from '../themes';

interface WheelProps {
  cards: Postcard[];
  theme: AppTheme;
  spinRequestId?: number;
  onSpinComplete: (card: Postcard) => void;
}

const Wheel: React.FC<WheelProps> = ({ cards, theme, spinRequestId = 0, onSpinComplete }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [startImageSrc, setStartImageSrc] = useState('');
  const [startImageFallbackTried, setStartImageFallbackTried] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const resultAudioRef = useRef<HTMLAudioElement | null>(null);
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

  const createResultAudio = useCallback((card: Postcard) => {
    const audio = new Audio(resolveAssetPath(card.sound || '/audio/card1.mp3'));
    audio.preload = 'auto';
    audio.loop = false;
    return audio;
  }, []);

  const stopResultAudio = useCallback(() => {
    const resultAudio = resultAudioRef.current;
    if (!resultAudio) return;

    try {
      resultAudio.pause();
      resultAudio.currentTime = 0;
      resultAudio.onended = null;
    } catch {
      // Ignore browsers that reject resetting an unloaded audio element.
    }
  }, []);

  const prepareSelectedCardSound = useCallback((card: Postcard) => {
    stopResultAudio();

    const resultAudio = createResultAudio(card);
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

  const playSelectedCardSound = useCallback((card: Postcard) => {
    const selectionAudio = resultAudioRef.current ?? createResultAudio(card);
    resultAudioRef.current = selectionAudio;

    try {
      selectionAudio.pause();
      selectionAudio.currentTime = 0;
      selectionAudio.muted = false;
      selectionAudio.volume = 1;
      selectionAudio.play().catch(() => undefined);
      startAudioEffect();
      selectionAudio.onended = () => {
        endAudioEffect();
        selectionAudio.onended = null;
      };
    } catch {
      // Ignore result audio playback failures; the visual result should still appear.
    }
  }, [createResultAudio, endAudioEffect, startAudioEffect]);

  useEffect(() => {
    const audio = new Audio(resolveAssetPath(theme.audio.spin));
    audio.preload = 'auto';
    audio.loop = true;
    audioRef.current = audio;

    return () => {
      try {
        audio.pause();
        audio.onended = null;
      } catch {
        // Ignore browsers that reject resetting an unloaded audio element.
      }

      stopResultAudio();
    };
  }, [stopResultAudio, theme.audio.spin]);

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
    const finalRotation = rotation + randomRotation;
    const selectedIndex = getWheelSelectedIndex(finalRotation, cards.length);
    const selectedCard = cards[selectedIndex];

    prepareSelectedCardSound(selectedCard);

    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.loop = true;
        audioRef.current.volume = 0.9;
        audioRef.current.play().catch(() => undefined);
        startAudioEffect();
        audioRef.current.onended = () => {
          endAudioEffect();
          if (audioRef.current) audioRef.current.onended = null;
        };
      }
    } catch {
      // Spin audio is decorative; keep the wheel usable if playback fails.
    }

    setRotation(finalRotation);

    const endHandler = () => {
      setIsSpinning(false);

      if (audioRef.current) {
        audioRef.current.loop = false;
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.onended = null;
          endAudioEffect();
        } catch {
          // Ignore browsers that reject resetting an unloaded audio element.
        }
      }

      playSelectedCardSound(selectedCard);
      onSpinComplete(selectedCard);
    };

    if (wheelRef.current) {
      wheelRef.current.addEventListener('transitionend', endHandler, { once: true });
    }
  }, [
    cards,
    endAudioEffect,
    isSpinning,
    onSpinComplete,
    playSelectedCardSound,
    prepareSelectedCardSound,
    rotation,
    startAudioEffect,
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
            <span className="text-xl">{theme.startButton.label}</span>
            {theme.startButton.sublabel ? (
              <span className="mt-1 text-[10px] font-bold">{theme.startButton.sublabel}</span>
            ) : null}
          </span>
        )}
      </button>
    </div>
  );
};

export default Wheel;
