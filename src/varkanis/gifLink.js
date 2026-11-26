import { getSession } from '../supabase.js';

// Turns whatever "copy link" gave into a media URL the card can show.
// Giphy is derivable from the id; Tenor/Imgur pages go through /api/gif.

const MEDIA = /\.(gif|mp4|webm|webp|png|jpe?g)(\?|$)/i;

function giphyId(u) {
  if (!/(^|\.)giphy\.com$/.test(u.hostname)) return null;
  const parts = u.pathname.split('/').filter(Boolean);
  // giphy.com/gifs/<slug>-<id>, giphy.com/embed/<id>,
  // media*.giphy.com/media/[v1.../]<id>/giphy.gif, i.giphy.com/<id>.gif
  if (['gifs', 'stickers', 'clips'].includes(parts[0])) return parts[1]?.split('-').pop() ?? null;
  if (parts[0] === 'embed') return parts[1] ?? null;
  if (parts.includes('media') && parts.length >= 3) return parts.at(-2);
  if (u.hostname === 'i.giphy.com' && parts.length === 1) return parts[0].split('.')[0];
  return null;
}

export async function resolveMediaLink(raw) {
  let u;
  try { u = new URL(raw.trim()); } catch { return raw.trim(); }

  const gid = giphyId(u);
  if (gid) return `https://media.giphy.com/media/${gid}/giphy.mp4`;

  if (u.hostname === 'i.imgur.com' && /\.gifv$/i.test(u.pathname)) {
    return `https://i.imgur.com${u.pathname.replace(/\.gifv$/i, '.mp4')}`;
  }
  if (MEDIA.test(u.pathname) || u.hostname.startsWith('media')) return u.href;

  if (/(^|\.)(tenor|imgur)\.com$/.test(u.hostname)) {
    const session = await getSession();
    const r = await fetch(`/api/gif?url=${encodeURIComponent(u.href)}`, {
      headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
    });
    if (!r.ok) throw new Error('resolve_failed');
    return (await r.json()).src;
  }
  return u.href;
}

export const isVideo = (src = '') => /\.(mp4|webm)(\?|$)/i.test(src);
