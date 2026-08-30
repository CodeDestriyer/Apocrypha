// PWA install plumbing. The browser fires `beforeinstallprompt` once, and it can
// fire before React mounts, so we capture it at module load into a singleton and
// let components subscribe. `appinstalled` clears it again.
//
// Chrome / Edge / Android give us the deferred prompt (a real one-tap install).
// iOS Safari never fires the event, so there we fall back to showing the manual
// "Share → Add to Home Screen" instructions instead of a live button.

import { useEffect, useReducer } from 'react';

let deferredPrompt = null;
const listeners = new Set();
const notify = () => { for (const fn of listeners) fn(); };

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

export const canPromptInstall = () => deferredPrompt != null;

// Already running as an installed app (home-screen launch)? Then there's nothing
// to install and the button/row should stay hidden.
export const isStandalone = () => {
  try {
    return (
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.matchMedia?.('(display-mode: fullscreen)').matches ||
      window.matchMedia?.('(display-mode: minimal-ui)').matches ||
      window.navigator.standalone === true
    );
  } catch { return false; }
};

// iOS/iPadOS Safari: no beforeinstallprompt, install is manual via the Share sheet.
export const isIOS = () => {
  try {
    const ua = window.navigator.userAgent || '';
    return (
      /iphone|ipad|ipod/i.test(ua) ||
      // iPadOS 13+ reports as desktop Safari but exposes touch points.
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
    );
  } catch { return false; }
};

// Fire the native install prompt. Returns 'accepted' | 'dismissed' | 'unavailable'.
export async function promptInstall() {
  if (!deferredPrompt) return 'unavailable';
  const evt = deferredPrompt;
  deferredPrompt = null;
  notify();
  try {
    evt.prompt();
    const { outcome } = await evt.userChoice;
    return outcome;
  } catch {
    return 'dismissed';
  }
}

// Re-render a component whenever install availability changes.
export function useInstall() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    listeners.add(force);
    return () => { listeners.delete(force); };
  }, []);
  return {
    installed: isStandalone(),
    canPrompt: canPromptInstall(),
    ios: isIOS(),
    promptInstall,
  };
}
