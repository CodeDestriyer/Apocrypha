import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// One-time recovery: any visitor whose splash hangs for >7s gets every SW
// unregistered and every cache wiped, then a hard reload. Survivors don't
// notice because the app reaches the LoginScreen well before that.
const RECOVERY_KEY = 'lr.recovered.v1';
function scheduleStuckRecovery() {
  const armed = setTimeout(async () => {
    if (sessionStorage.getItem(RECOVERY_KEY)) return;
    sessionStorage.setItem(RECOVERY_KEY, '1');
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {}
    window.location.reload();
  }, 7000);
  window.addEventListener('lr:app-ready', () => clearTimeout(armed), { once: true });
}
scheduleStuckRecovery();

// Strip the pre-rendered SEO landing markup before React mounts. createRoot()
// is supposed to replace children on first commit but if a CSS class from the
// fallback (e.g. .landing) is somehow still in the DOM it can bleed styles
// into the live app — clearing explicitly removes that risk.
const _rootEl = document.getElementById('root');
while (_rootEl?.firstChild) _rootEl.removeChild(_rootEl.firstChild);

ReactDOM.createRoot(_rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });

      const promote = (worker) => {
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            worker.postMessage('SKIP_WAITING');
          }
        });
      };
      promote(reg.installing);
      reg.addEventListener('updatefound', () => promote(reg.installing));

      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloaded) return;
        reloaded = true;
        window.location.reload();
      });

      const check = () => reg.update().catch(() => {});
      check();
      // Poll for updates every 30 minutes while open.
      setInterval(check, 30 * 60 * 1000);
      // And check whenever the user brings the tab/PWA back into focus.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    } catch {}
  });
}
