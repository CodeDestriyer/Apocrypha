// Hands out a short-lived signed URL for a course PDF. The preview is open to
// anyone; the full file needs a row in `purchases` for the calling user.
//
// Usage: GET /api/book?id=<course>&part=preview|full
import { admin, userFromRequest } from './_lib/supabase.js';

const BUCKET = 'courses';
const TTL = 300; // seconds

const BOOKS = {
  'mentes-bajo-control': {
    preview: 'mentes-bajo-control/preview.pdf',
    full: 'mentes-bajo-control/full.pdf',
  },
};

export default async function handler(req, res) {
  const id = (req.query?.id ?? '').toString();
  const part = (req.query?.part ?? 'preview').toString();
  const book = BOOKS[id];
  if (!book || !book[part]) return res.status(400).json({ error: 'invalid_request' });

  res.setHeader('Cache-Control', 'no-store');
  try {
    if (part === 'full') {
      const user = await userFromRequest(req);
      if (!user) return res.status(401).json({ error: 'unauthenticated' });
      const { data: owned, error: ownErr } = await admin()
        .from('purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .maybeSingle();
      if (ownErr) throw ownErr;
      if (!owned) return res.status(403).json({ error: 'not_purchased' });
    }

    const { data, error } = await admin().storage.from(BUCKET).createSignedUrl(book[part], TTL);
    if (error) throw error;
    return res.status(200).json({ url: data.signedUrl, expiresIn: TTL });
  } catch (e) {
    return res.status(500).json({ error: 'internal', detail: String(e?.message || e) });
  }
}
