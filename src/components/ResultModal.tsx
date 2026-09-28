import React from 'react';
import { resolveAssetPath } from '../lib/assetPaths';
import type { AppTheme, Postcard } from '../themes';
import { isAdventureTheme } from '../themes';

export type CardPlaybackState = 'ready' | 'playing' | 'paused';

interface ResultModalProps {
  card: Postcard | null;
  theme: AppTheme;
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  onTogglePlayback: () => void;
  playbackState: CardPlaybackState;
  onSpinAgain: () => void;
  spinAgainLabel?: string;
}

const ResultModal: React.FC<ResultModalProps> = ({ card, theme, isOpen, onClose, onSpinAgain, spinAgainLabel = '再抽一次' }) => {
  const [failedVideo, setFailedVideo] = React.useState<string | null>(null);
  const [failedImage, setFailedImage] = React.useState<string | null>(null);
  React.useEffect(() => { setFailedImage(null); }, [card?.image, isOpen]);
  if (!isOpen || !card) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label={card.title} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative mx-4 max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-2xl p-6 shadow-2xl" style={{ background: theme.surface }}>
        <div className="mb-4 flex justify-center">
          {card.video && card.video !== failedVideo ? (
            <video
              key={card.video}
              src={resolveAssetPath(card.video)}
              poster={card.image ? resolveAssetPath(card.image) : undefined}
              autoPlay
              loop
              muted
              playsInline
              onError={() => setFailedVideo(card.video ?? null)}
              className={isAdventureTheme(theme.id)
                ? 'aspect-square w-full rounded-xl object-contain shadow-md'
                : 'aspect-[4/3] w-full rounded-xl object-cover shadow-md'}
            />
          ) : card.image ? (
            <img
              src={resolveAssetPath(failedImage === card.image && card.fallbackImage ? card.fallbackImage : card.image)}
              onError={() => { if (card.fallbackImage) setFailedImage(card.image); }}
              alt={card.title}
              decoding="async"
              loading="eager"
              className={isAdventureTheme(theme.id)
                ? 'aspect-square w-full rounded-xl object-contain shadow-md'
                : theme.id === 'relaxed'
                  ? 'h-auto w-full rounded-xl shadow-md'
                  : 'aspect-[4/3] w-full rounded-xl object-cover shadow-md'}
            />
          ) : (
            <div
              className="flex aspect-[4/3] w-full items-center justify-center rounded-xl text-sm"
              style={{ background: '#f3f4f6', color: theme.mutedColor }}
            >
              暂无图片
            </div>
          )}
        </div>

        <h2 className="mb-3 text-center text-2xl font-bold" style={{ color: theme.titleColor }}>
          {card.title}
        </h2>

        <p className="mb-6 text-center text-base leading-relaxed" style={{ color: theme.bodyColor }}>
          {card.content}
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg bg-gray-200 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-300"
          >
            关闭
          </button>
          <button
            onClick={onSpinAgain}
            className="flex-1 rounded-lg px-4 py-3 font-semibold transition-transform hover:scale-[1.02]"
            style={{ background: theme.accentColor, color: theme.accentTextColor }}
          >
            {spinAgainLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
