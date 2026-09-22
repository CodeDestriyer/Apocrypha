// Binds a Gumroad licence key to the signed-in account. Gumroad is the
// merchant of record, so this is the only place a purchase enters our DB.
//
// Usage: POST /api/redeem { productId, licenseKey } + Bearer access token
import { admin, userFromRequest } from './_lib/supabase.js';

const GUMROAD_PRODUCT_IDS = {
  'mentes-bajo-control': process.env.GUMROAD_PRODUCT_ID,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const productId = (req.body?.productId ?? '').toString();
  const licenseKey = (req.body?.licenseKey ?? '').toString().trim();
  const gumroadProductId = GUMROAD_PRODUCT_IDS[productId];
  if (!gumroadProductId || !licenseKey || licenseKey.length > 128) {
    return res.status(400).json({ error: 'invalid_request' });
  }

  res.setHeader('Cache-Control', 'no-store');
  try {
    const user = await userFromRequest(req);
    if (!user) return res.status(401).json({ error: 'unauthenticated' });

    // `increment_uses_count=false`: the unique index on (provider, license_key)
    // is what limits a key to one account, so Gumroad's counter stays clean.
    const r = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        product_id: gumroadProductId,
        license_key: licenseKey,
        increment_uses_count: 'false',
      }),
    });
    const payload = await r.json().catch(() => null);
    if (!r.ok || !payload?.success) return res.status(404).json({ error: 'invalid_license' });

    const purchase = payload.purchase ?? {};
    if (purchase.refunded || purchase.chargebacked || purchase.disputed) {
      return res.status(403).json({ error: 'license_void' });
    }

    const { error } = await admin().from('purchases').insert({
      user_id: user.id,
      product_id: productId,
      provider: 'gumroad',
      license_key: licenseKey,
      order_id: purchase.sale_id ?? (purchase.order_number != null ? String(purchase.order_number) : null),
      buyer_email: purchase.email ?? null,
    });

    if (error) {
      if (error.code !== '23505') throw error;
      // Either this account already owns the book, or the key is on another one.
      const { data: mine } = await admin()
        .from('purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();
      if (!mine) return res.status(409).json({ error: 'license_in_use' });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'internal', detail: String(e?.message || e) });
  }
}
