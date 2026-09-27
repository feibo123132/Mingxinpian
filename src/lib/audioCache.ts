import { resolveAssetPath } from './assetPaths.ts';

export interface AudioCacheStatus {
  scope: string;
  files: { path: string; revision: string; size: number; saved: boolean }[];
  failed: { path: string; reason: string }[];
  currentFile?: string;
}

const workerRequest = async (
  type: 'audio-status' | 'audio-save',
  onProgress?: (status: AudioCacheStatus) => void,
): Promise<AudioCacheStatus> => {
  if (!('serviceWorker' in navigator) || !window.isSecureContext || import.meta.env?.DEV) {
    throw new Error('请在已发布的网站中使用本机音频保存功能');
  }
  const registration = await new Promise<ServiceWorkerRegistration>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('缓存功能尚未就绪，请稍后重试')), 10000);
    navigator.serviceWorker.ready.then(value => { clearTimeout(timer); resolve(value); }, error => {
      clearTimeout(timer); reject(error);
    });
  });
  const worker = navigator.serviceWorker.controller || registration.active;
  if (!worker) throw new Error('缓存功能尚未就绪，请稍后重试');
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    let timer: ReturnType<typeof setTimeout>;
    const finish = () => { clearTimeout(timer); channel.port1.close(); };
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        finish();
        reject(new Error('保存暂时中断，请重试；已保存的音频会保留。网站刚更新时，请刷新一次再试。'));
      }, type === 'audio-save' ? 330000 : 4000);
    };
    channel.port1.onmessage = event => {
      const message = event.data;
      resetTimer();
      if (message.type === 'progress') onProgress?.(message);
      else if (message.type === 'done') { finish(); resolve(message); }
      else if (message.type === 'error') { finish(); reject(new Error(message.error)); }
    };
    resetTimer();
    worker.postMessage({ type }, [channel.port2]);
  });
};

export const readAudioCache = () => workerRequest('audio-status');
export const saveAudioCache = (onProgress: (status: AudioCacheStatus) => void) =>
  workerRequest('audio-save', onProgress);

let catalogue: Promise<AudioCacheStatus | null> | null = null;
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => { catalogue = null; });
}

// The installed catalogue answers exact filename probes locally, even after refresh.
export const cachedAudioAvailability = async (src: string): Promise<boolean | null> => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator) || import.meta.env?.DEV) return null;
  catalogue ??= readAudioCache().catch(() => { catalogue = null; return null; });
  const status = await catalogue;
  if (!status) return null;
  const url = new URL(resolveAssetPath(src), window.location.href);
  if (!url.href.startsWith(new URL('audio/', status.scope).href)) return null;
  return status.files.some(file => new URL(file.path, status.scope).href === url.href);
};
