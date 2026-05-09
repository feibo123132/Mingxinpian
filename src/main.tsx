import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  const clearRuntimeAssetCaches = () => {
    if (!('caches' in window)) return Promise.resolve();

    return caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('runtime-')).map((key) => caches.delete(key))))
      .catch(() => {});
  };

  if (import.meta.env?.DEV) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        const shouldReloadAfterCleanup = registrations.length > 0 && Boolean(navigator.serviceWorker.controller);

        return Promise.all(registrations.map((registration) => registration.unregister()))
          .then(() => clearRuntimeAssetCaches())
          .then(() => {
            if (shouldReloadAfterCleanup) {
              window.location.reload();
            }
          });
      })
      .catch(() => {});
  } else {
    const base = import.meta.env.BASE_URL || '/';
    const prefix = base.endsWith('/') ? base : base + '/';
    navigator.serviceWorker.register(`${prefix}sw.js`).catch(() => {});
  }
}
