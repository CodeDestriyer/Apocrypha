// Vercel serverless function — fetches public TikTok profile page, extracts
// follower/likes counts from the embedded JSON payload. Edge-cached for an
// hour to stay below TT's anti-bot threshold and to keep latency low.
//
// Usage: GET /api/tt-stats?u=<tiktok_username>

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export default async function handler(req, res) {
  const raw = (req.query?.u ?? '').toString();
  const username = raw.replace(/^@/, '').trim();
  if (!username || !/^[a-zA-Z0-9._]{1,30}$/.test(username)) {
    return res.status(400).json({ error: 'invalid_username' });
  }
  try {
    const r = await fetch(`https://www.tiktok.com/@${username}`, {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.7',
      },
    });
    if (!r.ok) {
      return res.status(502).json({ error: 'tt_fetch_failed', status: r.status });
    }
    const html = await r.text();
    const m = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
    if (!m) {
      return res.status(502).json({ error: 'tt_payload_not_found' });
    }
    let data;
    try { data = JSON.parse(m[1]); }
    catch { return res.status(502).json({ error: 'tt_payload_invalid' }); }

    const userInfo = data?.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo;
    if (!userInfo) {
      return res.status(404).json({ error: 'tt_user_not_found' });
    }
    const stats = userInfo.stats || userInfo.statsV2 || {};
    const user = userInfo.user || {};

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({
      username,
      nickname: user.nickname ?? null,
      avatar: user.avatarMedium ?? user.avatarThumb ?? null,
      followers: numberish(stats.followerCount),
      following: numberish(stats.followingCount),
      likes: numberish(stats.heartCount ?? stats.heart),
      videos: numberish(stats.videoCount),
      fetchedAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({ error: 'internal', detail: String(e?.message || e) });
  }
}

function numberish(v) {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
