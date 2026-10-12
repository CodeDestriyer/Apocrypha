import { initializePaddle } from '@paddle/paddle-js';
import { supabase } from '../supabase.js';

const PRICE_IDS = {
  'mentes-bajo-control': import.meta.env.VITE_PADDLE_PRICE_MENTES_BAJO_CONTROL,
};

let paddlePromise = null;
let onCompleted = null;

function getPaddle() {
  if (paddlePromise) return paddlePromise;
  paddlePromise = initializePaddle({
    token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN,
    environment: import.meta.env.VITE_PADDLE_ENV === 'production' ? 'production' : 'sandbox',
    eventCallback: (ev) => { if (ev?.name === 'checkout.completed') onCompleted?.(); },
  });
  return paddlePromise;
}

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

const BUCKET = 'courses';
const PREVIEW_TTL = 60 * 60;

// Signed URL for a course PDF. `part` is 'preview' or 'full'.
//
// The preview is free, and storage RLS already lets anyone sign it, so it goes
// straight to Supabase — one less hop, and it keeps working even if the
// serverless env is misconfigured. The full book goes through /api/book, which
// signs with the service role after checking `purchases`.
export async function bookUrl(productId, part) {
  if (part === 'preview') {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(`${productId}/preview.pdf`, PREVIEW_TTL);
    if (error) throw new Error('preview_failed');
    return data.signedUrl;
  }

  const r = await fetch(`/api/book?id=${encodeURIComponent(productId)}&part=${part}`, {
    headers: await authHeaders(),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'book_failed');
  return data.url;
}

export async function openCheckout(productId, onDone) {
  const priceId = PRICE_IDS[productId];
  if (!priceId) throw new Error('price_not_configured');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('unauthenticated');

  const paddle = await getPaddle();
  if (!paddle) throw new Error('paddle_unavailable');

  onCompleted = onDone;
  paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    // Echoed back on the webhook; the price id is what actually decides
    // which product was paid for.
    customData: { userId: user.id, productId },
    ...(user.email ? { customer: { email: user.email } } : {}),
    settings: { variant: 'one-page' },
  });
}

// The purchase row is written by the webhook, so it lands a moment after the
// overlay closes. Poll briefly instead of making the reader reload.
export async function waitForPurchase(productId, { tries = 12, delayMs = 1500 } = {}) {
  for (let i = 0; i < tries; i++) {
    if (await hasPurchase(productId)) return true;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
}
