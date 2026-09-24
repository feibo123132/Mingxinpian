import { useCallback, useEffect, useRef, useState } from 'react';
import { Minus, Plus, Users, X } from 'lucide-react';
import type { AppTheme } from '../themes';
import { drawMultiplayer, multiplayerSegments, rotationForResult } from '../lib/multiplayer';
import { resolveAssetPath } from '../lib/assetPaths';
import { createAngelMusicPicker } from '../lib/adventureAngelAudio';
import { createDevilMusicPicker } from '../lib/adventureDevilAudio';
import { pickOptionalCardMusic } from '../lib/availableCardMusic';
import { selectCardSound } from '../lib/relaxedCardAudio';
import { useAudioBus } from '../store/audioBus';
import ResultModal from './ResultModal';
import { relaxedTheme } from '../themes/relaxed';
import { createAdventureBonusDrawer } from '../lib/adventureBonus';

interface Props { theme: AppTheme; initialCount: number; onExit: () => void }
interface Player { id: number; rotation: number; result: number | null; duration: number; finished: boolean }
const createPlayer = (id: number): Player => ({ id, rotation: 0, result: null, duration: 0, finished: true });
const MAX_PLAYERS = 20;
let boundary = 0;
const slices = multiplayerSegments.map(segment => {
  const start = boundary;
  boundary += segment.weight * 3.6;
  return { ...segment, start, end: boundary, middle: (start + boundary) / 2 };
});
const background = `conic-gradient(${slices.map(s => `${s.color} ${s.start}deg ${s.end}deg`).join(',')})`;

const pickAngelMusic = createAngelMusicPicker();
const pickDevilMusic = createDevilMusicPicker();

export function PlayerCountDialog({ initialCount, onConfirm, onClose }: {
  initialCount: number; onConfirm: (count: number) => void; onClose: () => void;
}) {
  const [value, setValue] = useState(String(initialCount));
  const dialog = useRef<HTMLDialogElement>(null);
  const count = Number(value);
  const valid = Number.isInteger(count) && count >= 1 && count <= MAX_PLAYERS;
  useEffect(() => { const node = dialog.current; node?.showModal(); return () => node?.close(); }, []);
  return <dialog ref={dialog} onCancel={onClose} aria-label="设置转盘数量" className="w-[calc(100%_-_2rem)] max-w-sm rounded-3xl bg-[#fffdf5] p-6 text-[#384638] shadow-2xl backdrop:bg-black/40">
    <form onSubmit={event => { event.preventDefault(); if (valid) onConfirm(count); }}>
      <div className="mb-5 flex items-center justify-between"><h2 className="flex items-center gap-2 text-xl font-bold"><Users size={22} />需要几个转盘？</h2><button type="button" onClick={onClose} aria-label="关闭人数选择"><X size={20} /></button></div>
      <label htmlFor="player-count" className="mb-2 block text-sm">多人同玩或单人多轮，进入后还可以增减</label>
      <input autoFocus id="player-count" type="number" min="1" max={MAX_PLAYERS} step="1" value={value} onChange={event => setValue(event.target.value)} className="w-full rounded-xl border border-[#c9cdb9] bg-white p-3 text-center text-3xl font-bold" />
      <p className="mt-2 text-sm text-[#78816d]">支持 1–20 个转盘；一个人玩 4 轮可设置为 4 个</p>
      <button disabled={!valid} className="mt-6 w-full rounded-xl bg-[#e8c65b] py-3 font-bold disabled:opacity-40">开始挑战</button>
    </form>
  </dialog>;
}

export default function MultiplayerMode({ theme, initialCount, onExit }: Props) {
  const compact = initialCount === 1;
  const [players, setPlayers] = useState<Player[]>(() => Array.from({ length: initialCount }, (_, i) => createPlayer(i + 1)));
  const nextId = useRef(initialCount + 1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pendingStops = useRef(new Map<number, () => void>());
  const locked = useRef(false);
  const [spinning, setSpinning] = useState(false);
  const [editing, setEditing] = useState(false);
  // 彩蛋冷却跨整局保留：组件随 multiplayerSession 重建时自然重置。
  const bonusDrawer = useRef(createAdventureBonusDrawer());
  const [resultQueue, setResultQueue] = useState<number[]>([]);
  const [bonusIndex, setBonusIndex] = useState<0 | 1 | null>(null);
  const [bonusShown, setBonusShown] = useState(false);
  // 彩蛋卡优先展示：触发时先弹彩蛋，关闭后再依次展示抽中的卡片。
  const showingBonus = bonusIndex !== null && !bonusShown;
  const spinAudio = useRef<HTMLAudioElement | null>(null);
  const afterSpinAudio = useRef<(() => void) | null>(null);
  const resultAudio = useRef<HTMLAudioElement[] | null>(null);
  const exclusiveResult = useRef(false);
  const playSequence = useRef(0);
  const stopResultAudio = useCallback(() => {
    playSequence.current += 1;
    const group = resultAudio.current;
    if (!group) return;
    resultAudio.current = null;
    group.forEach(audio => {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
    });
    useAudioBus.getState().endEffect();
    if (exclusiveResult.current) {
      exclusiveResult.current = false;
      useAudioBus.getState().endExclusive();
    }
  }, []);
  const playResults = (results: number[], audioTheme = theme) => {
    const playNext = async (position: number) => {
      if (position >= results.length) return;
      const token = playSequence.current;
      const card = audioTheme.cards[results[position]];
      let fixedMusic: string | undefined;
      if (card?.id === 'adventure-2') fixedMusic = pickAngelMusic();
      else if (card?.id === 'adventure-1') fixedMusic = pickDevilMusic();
      else if (card) fixedMusic = (await pickOptionalCardMusic(card.id)) ?? undefined;
      if (playSequence.current !== token) return;
      const exclusive = Boolean(fixedMusic);
      const cardSound = card ? selectCardSound(audioTheme.id, card) : '';
      const sounds = cardSound ? [cardSound] : [];
      if (fixedMusic) sounds.push(fixedMusic);
      if (!sounds.length) { playNext(position + 1); return; }
      try {
        const group = sounds.map(sound => new Audio(resolveAssetPath(sound)));
        if (fixedMusic && card?.id !== 'adventure-1') group[group.length - 1].volume = 0.6;
        resultAudio.current = group;
        useAudioBus.getState().startEffect();
        exclusiveResult.current = exclusive;
        if (exclusive) useAudioBus.getState().startExclusive();
        const pending = new Set(group);
        group.forEach(audio => {
          const finished = () => {
            if (resultAudio.current !== group || !pending.delete(audio)) return;
            audio.onended = null;
            audio.onerror = null;
            if (pending.size === 0) {
              stopResultAudio();
              playNext(position + 1);
            }
          };
          audio.onended = finished;
          audio.onerror = finished;
          // Start the card voice and fixed music together; wait for both before the next result.
          try { void audio.play().catch(finished); } catch { finished(); }
        });
      } catch {
        stopResultAudio();
        playNext(position + 1);
      }
    };
    playNext(0);
  };
  const stopSpinAudio = useCallback(() => {
    afterSpinAudio.current = null;
    const audio = spinAudio.current;
    if (!audio) return;
    spinAudio.current = null;
    audio.onerror = null;
    audio.onended = null;
    audio.pause();
    useAudioBus.getState().endEffect();
  }, []);
  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    pendingStops.current.clear();
    stopSpinAudio();
    stopResultAudio();
  }, [stopSpinAudio, stopResultAudio]);
  const finishSpinAudioLoop = (onFinished: () => void) => {
    const audio = spinAudio.current;
    if (!audio) { onFinished(); return; }
    afterSpinAudio.current = onFinished;
    audio.loop = false;
    // Match the single-wheel sound's position when its four-second spin ends.
    // This also keeps staggered multiplayer stops from revealing mid-loop.
    if (Number.isFinite(audio.duration) && audio.duration > 4) {
      try { audio.currentTime = 4; } catch { /* Continue the available tail. */ }
    }
    audio.onended = () => {
      if (spinAudio.current !== audio) return;
      const callback = afterSpinAudio.current;
      stopSpinAudio();
      callback?.();
    };
    if (audio.ended) {
      stopSpinAudio();
      onFinished();
    }
  };
  const draw = () => {
    if (locked.current) return;
    locked.current = true;
    setResultQueue([]);
    setBonusIndex(null);
    setBonusShown(false);
    setSpinning(true);
    setEditing(false);
    stopResultAudio();
    stopSpinAudio();
    try {
      const audio = new Audio(resolveAssetPath(theme.audio.spin));
      audio.loop = true;
      audio.volume = 0.9;
      spinAudio.current = audio;
      useAudioBus.getState().startEffect();
      const handleFailure = () => {
        if (spinAudio.current !== audio) return;
        const callback = afterSpinAudio.current;
        stopSpinAudio();
        callback?.();
      };
      audio.onerror = handleFailure;
      void audio.play().catch(handleFailure);
    } catch {
      // Audio restrictions must not interrupt the round or leave the BGM ducked.
      stopSpinAudio();
    }
    timers.current.forEach(clearTimeout);
    const results = drawMultiplayer(players.length);
    const next = players.map((player, i) => ({ ...player, result: results[i], rotation: rotationForResult(player.rotation, results[i]), duration: 4000 + i * 180, finished: false }));
    setPlayers(next);
    pendingStops.current.clear();
    timers.current = next.map(player => {
      const finish = () => {
      if (!pendingStops.current.delete(player.id)) return;
      setPlayers(current => current.map(p => p.id === player.id ? { ...p, finished: true } : p));
      if (pendingStops.current.size === 0) {
        locked.current = false;
        setSpinning(false);
        const bonus = theme.id === 'adventure' ? bonusDrawer.current() : null;
        setResultQueue(results);
        setBonusIndex(bonus);
        setBonusShown(false);
        finishSpinAudioLoop(() => {
          // 彩蛋卡先出场：先播彩蛋语音；未触发时按原顺序播抽中卡片的语音。
          if (bonus !== null) playResults([bonus], relaxedTheme);
          else playResults(results);
        });
      }
      };
      pendingStops.current.set(player.id, finish);
      // Fallback for hidden tabs or browsers that omit transitionend.
      return setTimeout(finish, player.duration + 1000);
    });
  };
  return <section className={compact ? "flex w-full max-w-sm flex-1 flex-col items-center justify-center py-8" : "w-full max-w-6xl py-8"} aria-label="多个转盘">
    {!compact && <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-bold" style={{ color: theme.titleColor }}>准备好，开始闯关</h2><p className="mt-1 text-sm">{players.length} 个转盘 · 可分给多人，也可作为一个人的多轮挑战</p></div>
      <div className="flex flex-wrap gap-2">
        <button disabled={spinning} onClick={() => setEditing(value => !value)} aria-pressed={editing} className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold shadow-sm disabled:opacity-40">{editing ? '完成' : '编辑'}</button>
        {editing && <button disabled={spinning || players.length >= MAX_PLAYERS} onClick={() => setPlayers(current => [...current, createPlayer(nextId.current++)])} className="flex items-center gap-1 rounded-full bg-white/80 px-4 py-2 text-sm font-bold shadow-sm disabled:opacity-40"><Plus size={16} />增加转盘</button>}
        <button disabled={spinning} onClick={onExit} className="rounded-full bg-white/60 px-4 py-2 text-sm disabled:opacity-40">单个转盘</button>
      </div>
    </div>}
    <div className={compact ? "w-full" : "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}>
      {players.map((player, index) => <article key={player.id} className={compact ? "relative w-full" : "rounded-3xl border border-white/80 bg-white/45 p-4 shadow-sm"}>
        {!compact && <div className="mb-4 flex h-8 items-center justify-between"><h3 className="font-bold">转盘 {index + 1}</h3>{editing && <button disabled={spinning || players.length <= 1} onClick={() => setPlayers(current => current.filter(p => p.id !== player.id))} aria-label={`移除转盘 ${index + 1}`} className="rounded-full bg-white/80 p-2 disabled:opacity-25"><Minus size={16} /></button>}</div>}
        <div className={`relative mx-auto aspect-square w-full ${compact ? "max-w-[320px]" : "max-w-[260px]"}`}>
          <div onTransitionEnd={event => {
            if (event.target === event.currentTarget && event.propertyName === 'transform') pendingStops.current.get(player.id)?.();
          }} className="absolute inset-0 rounded-full shadow-lg" style={{ background, transform: `rotate(${player.rotation}deg)`, transition: `transform ${player.duration}ms cubic-bezier(.15,.65,.12,1)` }}>
            {slices.map(s => <div key={s.label} className="absolute left-1/2 top-1/2 text-center text-[13px] font-extrabold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.25)', writingMode: 'vertical-rl', textOrientation: 'upright', lineHeight: 1.2, whiteSpace: 'nowrap', transform: `translate(-50%, -50%) rotate(${s.middle}deg) translateY(${compact ? '-100px' : '-72px'})` }}><span>{s.label}</span></div>)}
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
        <p aria-live="polite" className={compact ? "absolute -top-10 left-0 w-full text-center text-sm font-bold" : "mt-5 min-h-8 text-center text-lg font-bold"} style={{ color: theme.titleColor }}>{!player.finished ? '转呀转…' : player.result === null ? (compact ? '' : '准备就绪') : slices[player.result].label}</p>
      </article>)}
    </div>
    <div className="mt-8 flex justify-center"><button onClick={draw} disabled={spinning} className={`rounded-full border-4 border-white font-black shadow-lg transition-transform hover:scale-105 disabled:opacity-60 ${compact ? "flex h-[88px] w-[88px] items-center justify-center text-lg" : "px-14 py-4 text-2xl"}`} style={{ background: theme.accentColor, color: theme.accentTextColor }}>{spinning ? '抽取中…' : '抽取'}</button></div>
    <ResultModal
      card={showingBonus ? relaxedTheme.cards[bonusIndex] : resultQueue.length ? theme.cards[resultQueue[0]] : null}
      theme={showingBonus ? relaxedTheme : theme}
      isOpen={resultQueue.length > 0 || showingBonus}
      onClose={() => {
        if (showingBonus) {
          afterSpinAudio.current = null;
          stopResultAudio();
          setBonusShown(true);
          if (resultQueue.length) {
            const playDrawn = () => playResults(resultQueue);
            // 极速关闭时仍需等待转盘音效的余音。
            if (spinAudio.current) afterSpinAudio.current = playDrawn;
            else playDrawn();
          } else {
            setBonusIndex(null);
          }
        } else {
          stopResultAudio();
          afterSpinAudio.current = null;
          if (resultQueue.length > 1) {
            const playRemaining = () => playResults(resultQueue.slice(1));
            if (spinAudio.current) afterSpinAudio.current = playRemaining;
            else playRemaining();
          }
          setResultQueue(queue => queue.slice(1));
        }
      }}
      onSpinAgain={draw}
    />
  </section>;
}
