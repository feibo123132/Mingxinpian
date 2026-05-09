import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Music } from 'lucide-react';
import { resolveAssetPath } from '../lib/assetPaths';
import { useAudioBus } from '../store/audioBus';

interface BgmControllerProps {
  tracks: string[];
  accentColor: string;
}

const BgmController: React.FC<BgmControllerProps> = ({ tracks, accentColor }) => {
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState<number | null>(null);
  const fadeTimerRef = useRef<number | null>(null);
  const baseVol = 0.6;
  const duckVol = baseVol * 0.42;
  const activeCount = useAudioBus((state) => state.activeCount);

  const audios = useMemo(() => {
    return tracks.map((track) => {
      const audio = new Audio(resolveAssetPath(track));
      audio.preload = 'auto';
      audio.loop = false;
      audio.volume = baseVol;
      return audio;
    });
  }, [tracks]);

  useEffect(() => {
    setPlaying(false);
    setCurrent(null);

    return () => {
      audios.forEach((audio) => {
        try {
          audio.pause();
          audio.currentTime = 0;
          audio.onended = null;
        } catch {
          // Ignore browsers that reject resetting an unloaded audio element.
        }
      });
    };
  }, [audios]);

  useEffect(() => {
    audios.forEach((audio) => {
      try {
        audio.muted = true;
        audio.play().then(() => audio.pause()).catch(() => undefined);
        audio.muted = false;
      } catch {
        // Background music is optional; keep the UI usable if autoplay fails.
      }
    });
  }, [audios]);

  useEffect(() => {
    if (!playing) return;

    const audio = current != null ? audios[current] : null;
    if (!audio) return;

    if (fadeTimerRef.current) {
      window.clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }

    if (activeCount > 0) {
      audio.volume = duckVol;
      return;
    }

    const duration = 2000;
    const stepMs = 50;
    const steps = Math.floor(duration / stepMs);
    const start = audio.volume;
    let i = 0;

    fadeTimerRef.current = window.setInterval(() => {
      i += 1;
      const t = Math.min(i / steps, 1);
      audio.volume = start + (baseVol - start) * t;

      if (t >= 1 && fadeTimerRef.current) {
        window.clearInterval(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
    }, stepMs);
  }, [activeCount, audios, current, duckVol, playing]);

  const playIndex = useCallback(
    (idx: number) => {
      if (!audios.length) return;

      setCurrent(idx);
      audios.forEach((audio, audioIndex) => {
        if (audioIndex !== idx) {
          try {
            audio.pause();
            audio.currentTime = 0;
            audio.onended = null;
          } catch {
            // Ignore browsers that reject resetting an unloaded audio element.
          }
        }
      });

      const audio = audios[idx];
      try {
        audio.volume = activeCount > 0 ? duckVol : baseVol;
        audio.play().catch(() => undefined);
        audio.onended = () => {
          const choices = audios.map((_, i) => i).filter((i) => i !== idx);
          const next = choices[Math.floor(Math.random() * choices.length)] ?? idx;
          playIndex(next);
        };
        setPlaying(true);
      } catch {
        // Background music is optional; keep the UI usable if playback fails.
      }
    },
    [activeCount, audios, duckVol],
  );

  const toggle = () => {
    if (!playing) {
      const startIdx = Math.floor(Math.random() * Math.max(audios.length, 1));
      playIndex(startIdx);
      return;
    }

    const audio = current != null ? audios[current] : null;
    if (audio) {
      try {
        audio.pause();
      } catch {
        // Ignore browsers that reject pausing an unloaded audio element.
      }
    }
    setPlaying(false);
  };

  return (
    <button
      onClick={toggle}
      className="absolute left-0 top-0 rounded-full p-2 shadow-md transition-transform duration-200 hover:scale-105"
      aria-label="音乐控制"
      title={playing ? '暂停背景音乐' : '播放背景音乐'}
      style={{
        backgroundColor: playing ? accentColor : '#e5e7eb',
        animation: playing ? 'music-spin 3s linear infinite' : undefined,
      }}
    >
      <Music className={`h-6 w-6 ${playing ? 'text-white' : 'text-gray-700'}`} />
    </button>
  );
};

export default BgmController;
