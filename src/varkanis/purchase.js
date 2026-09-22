import { supabase } from '../supabase.js';

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return session ? { Authorization: `Bearer ${session.access_token}` } : {};
}

export async function hasPurchase(productId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();
  return !!data;
}

// Signed URL, valid for a few minutes. `part` is 'preview' or 'full'.
export async function bookUrl(productId, part) {
  const r = await fetch(`/api/book?id=${encodeURIComponent(productId)}&part=${part}`, {
    headers: await authHeaders(),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'book_failed');
  return data.url;
}

export async function redeemLicense(productId, licenseKey) {
  const r = await fetch('/api/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({ productId, licenseKey }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'redeem_failed');
  return true;
}
