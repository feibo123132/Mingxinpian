import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Play, Plus, Trash2, X } from 'lucide-react';
import { resolveAssetPath } from '../lib/assetPaths';
import { discoverSequentialAudio, probeAudio } from '../lib/availableCardMusic';
import { relaxedPairMusic, relaxedPairSounds, type RelaxedAudioPair } from '../lib/relaxedAudioPairs';
import { useAudioBus } from '../store/audioBus';

interface Props {
  isOpen: boolean;
  pairs: RelaxedAudioPair[];
  onClose: () => void;
  onSave: (pairs: RelaxedAudioPair[]) => void;
}

const fileName = (path: string) => path.split('/').pop() ?? path;
const createPairId = () => globalThis.crypto?.randomUUID?.() ?? `pair-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function RelaxedPairEditor({ isOpen, pairs, onClose, onSave }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previewRef = useRef<HTMLAudioElement[]>([]);
  const previewExclusiveRef = useRef(false);
  const [draft, setDraft] = useState<RelaxedAudioPair[]>(pairs);
  const [sound, setSound] = useState(relaxedPairSounds[0]);
  const [music, setMusic] = useState(relaxedPairMusic[0]);
  const [availableSounds, setAvailableSounds] = useState<string[]>(relaxedPairSounds);
  const [availableMusic, setAvailableMusic] = useState<string[]>(relaxedPairMusic);
  const [previewing, setPreviewing] = useState(false);

  const stopPreview = useCallback(() => {
    previewRef.current.forEach(audio => { audio.onended = null; audio.onerror = null; audio.pause(); });
    previewRef.current = [];
    if (previewExclusiveRef.current) {
      previewExclusiveRef.current = false;
      useAudioBus.getState().endExclusive();
    }
    setPreviewing(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(pairs);
    const dialog = dialogRef.current;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      stopPreview();
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, pairs, stopPreview]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    void Promise.all([
      discoverSequentialAudio(
        [relaxedPairSounds[0]],
        index => `/audio/relaxed-card-${String(index).padStart(2, '0')}.mp3`,
        probeAudio,
      ),
      discoverSequentialAudio(
        [relaxedPairMusic[0], '/audio/relaxed-card-music1.mp3'],
        index => `/audio/relaxed-card-music${index}.mp3`,
        probeAudio,
      ),
    ]).then(([sounds, musicTracks]) => {
      if (!active) return;
      setAvailableSounds(sounds);
      setAvailableMusic(musicTracks);
      if (sounds.length) setSound(current => sounds.includes(current) ? current : sounds[0]);
      if (musicTracks.length) setMusic(current => musicTracks.includes(current) ? current : musicTracks[0]);
    });
    return () => { active = false; };
  }, [isOpen]);

  const playPair = (selectedSound: string, selectedMusic: string) => {
    stopPreview();
    try {
      const voice = new Audio(resolveAssetPath(selectedSound));
      const backing = new Audio(resolveAssetPath(selectedMusic));
      backing.volume = 0.6;
      const group = [voice, backing];
      previewRef.current = group;
      useAudioBus.getState().startExclusive();
      previewExclusiveRef.current = true;
      setPreviewing(true);
      const pending = new Set(group);
      group.forEach(audio => {
        const finish = () => {
          if (!pending.delete(audio)) return;
          if (pending.size === 0 && previewRef.current === group) stopPreview();
        };
        audio.onended = finish;
        audio.onerror = finish;
        try { void audio.play().catch(finish); } catch { finish(); }
      });
    } catch { stopPreview(); }
  };

  const addPair = () => {
    if (draft.length >= 10 || !availableSounds.includes(sound) || !availableMusic.includes(music)) return;
    setDraft(current => [...current, { id: createPairId(), sound, music }]);
  };

  const movePair = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= draft.length) return;
    setDraft(current => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  if (!isOpen) return null;
  return <dialog ref={dialogRef} aria-labelledby="pair-editor-title" onCancel={event => { event.preventDefault(); onClose(); }}
    className="m-auto w-[calc(100%_-_2rem)] max-w-3xl overflow-hidden rounded-[2rem] border border-white bg-[#fffdf7] p-0 text-[#384638] shadow-2xl backdrop:bg-black/35 backdrop:backdrop-blur-sm">
    <div className="flex max-h-[90dvh] flex-col">
      <header className="flex items-start justify-between gap-4 border-b border-[#e7e9d9] px-6 pb-5 pt-6 sm:px-8 sm:pt-8">
        <div><p className="mb-2 text-[10px] font-bold tracking-[.25em] text-[#8c9d72]">YOUR SOUND PAIRS</p><h2 id="pair-editor-title" className="text-2xl font-bold">我的音乐搭配</h2><p className="mt-2 text-sm text-[#78816d]">“轻松绷住”和“为人严肃”共用下面的播放顺序，每抽一次播放下一组。</p></div>
        <button type="button" onClick={onClose} aria-label="关闭搭配编辑" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/5 text-gray-500 hover:bg-black/10"><X size={18} /></button>
      </header>
      <div className="grid min-h-0 gap-5 overflow-y-auto p-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] sm:p-8">
        <section className="rounded-2xl border border-[#e2e7d8] bg-[#f5f7ee] p-4" aria-label="创建搭配">
          <p className="mb-4 text-sm font-bold">创建一组搭配</p>
          <label className="mb-3 block text-xs font-semibold text-[#58614e]">卡片音效
            <select value={sound} onChange={event => setSound(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#d6deca] bg-white px-3 py-2.5 text-sm">
              {availableSounds.map(track => <option key={track} value={track}>{fileName(track)}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#58614e]">背景配乐
            <select value={music} onChange={event => setMusic(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#d6deca] bg-white px-3 py-2.5 text-sm">
              {availableMusic.map(track => <option key={track} value={track}>{fileName(track)}</option>)}
            </select>
          </label>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => previewing ? stopPreview() : playPair(sound, music)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#b7c3a3] bg-white px-3 py-2.5 text-xs font-bold hover:bg-[#f9fbf4]"><Play size={14} />{previewing ? '停止试听' : '同时试听'}</button>
            <button type="button" onClick={addPair} disabled={draft.length >= 10 || !availableSounds.includes(sound) || !availableMusic.includes(music)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#d9b74e] px-3 py-2.5 text-xs font-bold text-[#493d1b] hover:bg-[#e8c65b] disabled:opacity-40"><Plus size={14} />加入顺序</button>
          </div>
        </section>
        <section aria-label="搭配播放顺序">
          <div className="mb-3 flex items-baseline justify-between"><h3 className="text-sm font-bold">播放顺序</h3><span className="text-xs text-[#78816d]">{draft.length}/10 组</span></div>
          {draft.length === 0 ? <div className="rounded-2xl border border-dashed border-[#c9d2bd] bg-white/70 p-6 text-center text-sm leading-6 text-[#78816d]">还没有搭配。先试听，再把喜欢的组合加入这里。</div> :
            <ol className="space-y-2">{draft.map((pair, index) => <li key={pair.id} className="rounded-2xl border border-[#e2e7d8] bg-white p-3 shadow-sm">
              <div className="flex items-start gap-2"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f3ebcc] text-xs font-bold text-[#6d5c25]">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{fileName(pair.sound)}</p><p className="mt-1 truncate text-[11px] text-[#78816d]">＋ {fileName(pair.music)}</p></div></div>
              <div className="mt-2 flex justify-end gap-1"><button type="button" onClick={() => playPair(pair.sound, pair.music)} aria-label={`试听第 ${index + 1} 组`} className="rounded-lg p-1.5 text-[#58614e] hover:bg-[#f5f7ee]"><Play size={15} /></button><button type="button" onClick={() => movePair(index, -1)} disabled={index === 0} aria-label={`上移第 ${index + 1} 组`} className="rounded-lg p-1.5 text-[#58614e] hover:bg-[#f5f7ee] disabled:opacity-30"><ArrowUp size={15} /></button><button type="button" onClick={() => movePair(index, 1)} disabled={index === draft.length - 1} aria-label={`下移第 ${index + 1} 组`} className="rounded-lg p-1.5 text-[#58614e] hover:bg-[#f5f7ee] disabled:opacity-30"><ArrowDown size={15} /></button><button type="button" onClick={() => setDraft(current => current.filter(item => item.id !== pair.id))} aria-label={`删除第 ${index + 1} 组`} className="rounded-lg p-1.5 text-[#9f6055] hover:bg-[#fff0ed]"><Trash2 size={15} /></button></div>
            </li>)}</ol>}
          <p className="mt-3 text-xs leading-5 text-[#78816d]">两张卡共用这条顺序；只留一组就会固定播放，多组依次循环。</p>
        </section>
      </div>
      <footer className="flex items-center justify-between gap-3 border-t border-[#e7e9d9] bg-white/70 px-6 py-4 sm:px-8"><span className="text-xs text-[#78816d]">{draft.length ? '保存后开启新一轮' : '清空后退出搭配模式'}</span><button type="button" onClick={() => { stopPreview(); onSave(draft); }} className="rounded-xl bg-[#e8c65b] px-5 py-2.5 text-sm font-bold text-[#493d1b] hover:bg-[#f0d36e]">{draft.length ? '保存并开启' : '保存空列表'}</button></footer>
    </div>
  </dialog>;
}
