import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { resolveAssetPath } from '../lib/assetPaths';
import { MAX_POSTCARDS, MIN_POSTCARDS } from '../themes/storage';
import type { AppTheme, Postcard } from '../themes';

interface SettingsModalProps {
  isOpen: boolean;
  theme: AppTheme;
  cards: Postcard[];
  onClose: () => void;
  onSave: (cards: Postcard[]) => void;
}

const createCard = (index: number, theme: AppTheme): Postcard => {
  const base = theme.cards[index % theme.cards.length];

  return {
    id: `custom-${Date.now()}-${index + 1}`,
    title: `明信片 ${index + 1}`,
    content: '',
    image: '',
    sound: base?.sound || '/audio/card1.mp3',
  };
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, theme, cards, onClose, onSave }) => {
  const [localCards, setLocalCards] = useState<Postcard[]>(cards);

  useEffect(() => {
    if (isOpen) {
      setLocalCards(cards.slice(0, MAX_POSTCARDS));
    }
  }, [cards, isOpen]);

  const updateCard = (index: number, field: 'title' | 'content', value: string) => {
    const updatedCards = [...localCards];
    updatedCards[index] = { ...updatedCards[index], [field]: value };
    setLocalCards(updatedCards);
  };

  const updateImage = (index: number, dataUrl: string) => {
    const updatedCards = [...localCards];
    updatedCards[index] = { ...updatedCards[index], image: dataUrl };
    setLocalCards(updatedCards);
  };

  const addCard = () => {
    if (localCards.length >= MAX_POSTCARDS) return;
    setLocalCards([...localCards, createCard(localCards.length, theme)]);
  };

  const deleteCard = (index: number) => {
    if (localCards.length <= MIN_POSTCARDS) return;
    setLocalCards(localCards.filter((_, cardIndex) => cardIndex !== index));
  };

  const handleSave = () => {
    onSave(localCards.slice(0, MAX_POSTCARDS));
    onClose();
  };

  const resetToDefault = () => {
    setLocalCards(theme.cards.slice(0, MAX_POSTCARDS));
  };

  if (!isOpen) return null;

  const canAdd = localCards.length < MAX_POSTCARDS;
  const canDelete = localCards.length > MIN_POSTCARDS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium" style={{ color: theme.mutedColor }}>
              当前主题：{theme.shortName}
            </p>
            <h2 className="text-xl font-bold" style={{ color: theme.titleColor }}>
              编辑明信片
            </h2>
          </div>
          <button onClick={onClose} className="text-2xl text-gray-500 transition-colors hover:text-gray-700">
            ×
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            当前共 {localCards.length} 张，最多可添加到 {MAX_POSTCARDS} 张；其他主题不会被覆盖。
          </p>
          <button
            onClick={addCard}
            disabled={!canAdd}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: theme.accentColor, color: theme.accentTextColor }}
          >
            <Plus className="h-4 w-4" />
            增加明信片
          </button>
        </div>

        <div className="mb-6 space-y-4">
          {localCards.slice(0, MAX_POSTCARDS).map((card, index) => (
            <div key={card.id} className="rounded-lg border bg-gray-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-medium text-gray-700">明信片 {index + 1}</h3>
                <button
                  onClick={() => deleteCard(index)}
                  disabled={!canDelete}
                  className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-sm font-medium text-red-500 shadow-sm transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                  删除
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600">标题</label>
                  <input
                    type="text"
                    value={card.title}
                    onChange={(event) => updateCard(index, 'title', event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': theme.accentColor } as React.CSSProperties}
                    placeholder="输入明信片标题"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-600">内容</label>
                  <textarea
                    value={card.content}
                    onChange={(event) => updateCard(index, 'content', event.target.value)}
                    className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': theme.accentColor } as React.CSSProperties}
                    placeholder="输入明信片内容"
                    rows={2}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-600">图片</label>
                  <div className="flex flex-wrap items-center gap-4">
                    {card.image ? (
                      <img
                        src={resolveAssetPath(card.image)}
                        alt={card.title}
                        className="h-20 w-20 rounded-lg border object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-lg border bg-white text-xs text-gray-400">
                        无图
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          updateImage(index, reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    <button
                      onClick={() => updateImage(index, '')}
                      className="rounded-lg bg-gray-200 px-3 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-300"
                    >
                      清除图片
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">支持 JPG/PNG/SVG，上传后会保存到当前浏览器。</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={resetToDefault}
            className="rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-300"
          >
            重置当前主题
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-500 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-600"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg px-4 py-2 font-semibold transition-transform hover:scale-[1.02]"
            style={{ background: theme.accentColor, color: theme.accentTextColor }}
          >
            保存到本地
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
