// Resolves a GIF page link (Tenor, Imgur, Giphy) to the media file behind it,
// read from the page's og: tags. The browser can't do this itself (CORS).
// Admin-only, and only for these hosts, so it isn't an open fetch proxy.
//
// Usage: GET /api/gif?url=<page url>   (Authorization: Bearer <token>)
import { admin, userFromRequest } from './_lib/supabase.js';

const HOSTS = ['tenor.com', 'giphy.com', 'imgur.com'];

function allowed(u) {
  return u.protocol === 'https:' && HOSTS.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`));
}

function meta(html, prop) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*>`, 'i');
  const tag = html.match(re)?.[0];
  return tag?.match(/content=["']([^"']+)["']/i)?.[1]?.replace(/&amp;/g, '&') ?? null;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const user = await userFromRequest(req);
  if (!user) return res.status(401).json({ error: 'unauthenticated' });
  const { data: isAdmin } = await admin().from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!isAdmin) return res.status(403).json({ error: 'forbidden' });

  let page;
  try { page = new URL((req.query?.url ?? '').toString()); } catch { return res.status(400).json({ error: 'bad_url' }); }
  if (!allowed(page)) return res.status(400).json({ error: 'host_not_allowed' });

  try {
    const r = await fetch(page, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Varkanis/1.0)', Accept: 'text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok || !allowed(new URL(r.url))) return res.status(502).json({ error: 'fetch_failed' });
    const html = (await r.text()).slice(0, 400_000);
    // mp4 first: a fraction of the GIF's weight.
    const video = meta(html, 'og:video:secure_url') ?? meta(html, 'og:video');
    const image = meta(html, 'og:image');
    const src = [video, image].find((s) => s && /^https:\/\//.test(s) && !/\.html?(\?|$)/.test(s));
    if (!src) return res.status(404).json({ error: 'no_media' });
    return res.status(200).json({ src });
  } catch {
    return res.status(502).json({ error: 'fetch_failed' });
  }
}
