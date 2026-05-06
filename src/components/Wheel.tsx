import React, { useEffect, useRef, useState } from 'react';
import { resolveAssetPath } from '../lib/assetPaths';
import { useAudioBus } from '../store/audioBus';
import type { AppTheme, Postcard } from '../themes';

interface WheelProps {
  cards: Postcard[];
  theme: AppTheme;
  onSpinComplete: (card: Postcard) => void;
}

const Wheel: React.FC<WheelProps> = ({ cards, theme, onSpinComplete }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const selectionAudiosRef = useRef<HTMLAudioElement[]>([]);
  const audioUnlockedRef = useRef(false);
  const lastSelectedIndexRef = useRef<number>(0);

  useEffect(() => {
    const audio = new Audio(resolveAssetPath(theme.audio.spin));
    audio.preload = 'auto';
    audio.loop = true;
    audioRef.current = audio;

    selectionAudiosRef.current = cards.map((card, index) => {
      const selectionAudio = new Audio(resolveAssetPath(card.sound || `/audio/card${index + 1}.mp3`));
      selectionAudio.preload = 'auto';
      selectionAudio.loop = false;
      return selectionAudio;
    });

    return () => {
      try {
        audio.pause();
        audio.onended = null;
      } catch {}

      selectionAudiosRef.current.forEach((selectionAudio) => {
        try {
          selectionAudio.pause();
          selectionAudio.onended = null;
        } catch {}
      });
    };
  }, [cards, theme.audio.spin]);

  const spin = () => {
    if (isSpinning || !cards.length) return;

    setIsSpinning(true);

    if (!audioUnlockedRef.current) {
      selectionAudiosRef.current.forEach((audio) => {
        try {
          audio.muted = true;
          audio.play().then(() => audio.pause()).catch(() => {});
          audio.muted = false;
        } catch {}
      });
      audioUnlockedRef.current = true;
    }

    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.loop = true;
        audioRef.current.volume = 0.9;
        audioRef.current.play().catch(() => {});
        try {
          useAudioBus.getState().startEffect();
        } catch {}
        audioRef.current.onended = () => {
          try {
            useAudioBus.getState().endEffect();
          } catch {}
          if (audioRef.current) audioRef.current.onended = null;
        };
      }
    } catch {}

    const minRotation = 1800;
    const maxRotation = 3000;
    const randomRotation = Math.floor(Math.random() * (maxRotation - minRotation + 1)) + minRotation;
    const finalRotation = rotation + randomRotation;

    setRotation(finalRotation);

    const segmentAngle = 360 / cards.length;
    const normalizedAngle = (360 - (finalRotation % 360)) % 360;
    const selectedIndex = Math.floor(normalizedAngle / segmentAngle);
    const selectedCard = cards[selectedIndex];
    lastSelectedIndexRef.current = selectedIndex;

    const endHandler = () => {
      setIsSpinning(false);

      if (audioRef.current) {
        audioRef.current.loop = false;
        audioRef.current.onended = () => {
          try {
            useAudioBus.getState().endEffect();
          } catch {}
          if (audioRef.current) audioRef.current.onended = null;
        };
      }

      const selectionAudio = selectionAudiosRef.current[lastSelectedIndexRef.current];
      if (selectionAudio) {
        try {
          selectionAudio.currentTime = 0;
          selectionAudio.play().catch(() => {});
          try {
            useAudioBus.getState().startEffect();
          } catch {}
          selectionAudio.onended = () => {
            try {
              useAudioBus.getState().endEffect();
            } catch {}
            selectionAudio.onended = null;
          };
        } catch {}
      }

      onSpinComplete(selectedCard);
    };

    if (wheelRef.current) {
      wheelRef.current.addEventListener('transitionend', endHandler, { once: true });
    }
  };

  const segmentAngle = cards.length ? 360 / cards.length : 360;
  const gradientStops = cards
    .map((_, index) => {
      const start = index * segmentAngle;
      const end = (index + 1) * segmentAngle;
      const color = theme.wheel.colors[index % theme.wheel.colors.length];
      return `${color} ${start}deg ${end}deg`;
    })
    .join(', ');

  const startImage = theme.startButton.image ? resolveAssetPath(theme.startButton.image) : '';

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
            const labelRotation = ((midAngle % 360) + 360) % 360;
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
        {startImage ? (
          <img src={startImage} alt="" className="block h-full w-full object-cover" />
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
