import { useEffect, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';
import { readAudioCache, saveAudioCache, type AudioCacheStatus } from '../lib/audioCache';

interface Props { isOpen: boolean; onClose: () => void }
const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);

export default function AudioCachePanel({ isOpen, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<AudioCacheStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [persistent, setPersistent] = useState(false);
  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    let active = true;
    void readAudioCache().then(value => {
      if (active) { setStatus(value); setError(''); }
    }).catch(reason => { if (active) setError(reason.message); });
    return () => {
      active = false;
      dialog?.close();
      document.body.style.overflow = overflow;
      previousFocus?.focus();
    };
  }, [isOpen]);

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      // Safari grants this according to its storage policy; denial still allows caching.
      try { setPersistent(await navigator.storage?.persist?.() ?? false); } catch { /* Best effort. */ }
      setStatus(await saveAudioCache(setStatus));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '保存失败，请重试');
    } finally { setBusy(false); }
  };

  if (!isOpen) return null;
  const files = status?.files ?? [];
  const saved = files.filter(file => file.saved);
  const savedBytes = saved.reduce((sum, file) => sum + file.size, 0);
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  const complete = files.length > 0 && saved.length === files.length;
  return <dialog ref={dialogRef} aria-labelledby="audio-cache-title"
    onCancel={event => { event.preventDefault(); onClose(); }}
    className="m-auto w-[calc(100%_-_2rem)] max-w-md overflow-hidden rounded-3xl border-0 bg-[#fffdf7] p-6 text-left text-gray-800 shadow-2xl backdrop:bg-black/35">
    <header className="flex items-start justify-between gap-4">
      <div><h2 id="audio-cache-title" className="text-xl font-bold">保存音频到本机</h2><p className="mt-2 text-sm leading-relaxed text-gray-600">一次保存音效与背景音乐，刷新后直接使用本机文件。</p></div>
      <button type="button" onClick={onClose} aria-label="关闭音频保存" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/5"><X size={18} /></button>
    </header>
    <div className="my-6 rounded-2xl bg-amber-50 p-4" aria-live="polite">
      <p className="font-semibold">{status ? `已保存 ${saved.length} / ${files.length} 个音频` : '正在检查本机文件…'}</p>
      <p className="mt-1 text-sm text-gray-600">{status ? `${mb(savedBytes)} / ${mb(totalBytes)} MB` : '首次保存需要联网'}</p>
      <progress aria-label="音频保存进度" max={totalBytes || 1} value={savedBytes} className="mt-3 h-2 w-full accent-amber-500" />
      {busy && status?.currentFile && <p className="mt-2 break-all text-xs text-gray-500">正在保存：{status.currentFile.replace('audio/', '')}</p>}
      {complete && <p className="mt-2 text-sm font-semibold text-green-700">全部保存完成，可以正常刷新页面。</p>}
    </div>
    {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
    {!!status?.failed.length && <div className="mb-4 max-h-32 overflow-auto text-xs text-red-700"><p className="mb-1 font-semibold">{status.failed.length} 个文件未保存，可重试：</p>{status.failed.map(file => <p key={file.path} className="break-all">{file.path.replace('audio/', '')}：{file.reason}</p>)}</div>}
    <button type="button" disabled={busy} onClick={() => void save()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ecc955] px-4 py-3 font-bold text-[#463b20] disabled:opacity-60">
      <Download size={18} />{busy ? '正在保存…' : complete ? '检查并补齐音频' : '保存 / 继续保存'}
    </button>
    <p className="mt-4 text-xs leading-relaxed text-gray-500">保存时请保持页面打开；中断后可继续，已保存的文件不会重复下载。网站更新时只补充新增或有变化的音频。</p>
    <p className="mt-2 text-xs leading-relaxed text-gray-500">{persistent ? '浏览器已允许持久保存。' : '建议添加到主屏幕使用。'}清除网站数据或设备存储不足时，仍可能需要重新保存。</p>
  </dialog>;
}
