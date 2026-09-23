// Vercel Web Analytics should only count Varkanis landing visitors. Any device
// that has ever opened Apocrypha is the owner's, so it's flagged and dropped
// for good — IP filtering isn't available and home/mobile/VPN IPs drift anyway.
const OWNER_KEY = 'va-disable';

export function markOwnerDevice() {
  try { localStorage.setItem(OWNER_KEY, '1'); } catch {}
}

function isOwnerDevice() {
  try { return localStorage.getItem(OWNER_KEY) === '1'; } catch { return false; }
}

export function beforeSend(event) {
  if (isOwnerDevice()) return null;
  try {
    const hash = new URL(event.url).hash.replace(/^#/, '').toLowerCase();
    if (hash === 'apocrypha' || hash === 'app') return null;
  } catch {}
  return event;
}
