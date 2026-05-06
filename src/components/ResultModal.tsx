import React from 'react';
import type { AppTheme, Postcard } from '../themes';

interface ResultModalProps {
  card: Postcard | null;
  theme: AppTheme;
  isOpen: boolean;
  onClose: () => void;
  onSpinAgain: () => void;
}

const ResultModal: React.FC<ResultModalProps> = ({ card, theme, isOpen, onClose, onSpinAgain }) => {
  if (!isOpen || !card) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="mx-4 w-full max-w-sm rounded-2xl p-6 shadow-2xl" style={{ background: theme.surface }}>
        <div className="mb-4 flex justify-center">
          {card.image ? (
            <img
              src={card.image}
              alt={card.title}
              decoding="async"
              loading="eager"
              className="h-60 w-60 rounded-xl object-cover shadow-md"
            />
          ) : (
            <div
              className="flex h-60 w-60 items-center justify-center rounded-xl text-sm"
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
            再抽一次
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
