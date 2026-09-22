// Paddle notification destination. Paddle is the merchant of record, so a
// verified `transaction.completed` is the only thing that grants access.
//
// Anything other than 2xx makes Paddle retry (60 attempts over ~3 days), so
// the handler only 200s once the purchase is durably recorded — or when the
// event is one we deliberately ignore.
import { Paddle, Environment } from '@paddle/paddle-node-sdk';
import { admin } from './_lib/supabase.js';

// Paddle signs the raw bytes; Vercel's JSON parser would invalidate them.
export const config = { api: { bodyParser: false } };

// Price -> our product id. Kept server-side so a tampered `custom_data`
// can't grant access to something that wasn't paid for.
const PRODUCT_BY_PRICE = {
  [process.env.PADDLE_PRICE_MENTES_BAJO_CONTROL]: 'mentes-bajo-control',
};

let paddle = null;
function getPaddle() {
  if (paddle) return paddle;
  const key = process.env.PADDLE_API_KEY;
  if (!key) throw new Error('paddle_env_missing');
  paddle = new Paddle(key, {
    environment: process.env.PADDLE_ENV === 'production' ? Environment.production : Environment.sandbox,
  });
  return paddle;
}

// Paddle signs the exact bytes it sent, so a re-serialised object is useless —
// `bodyParser: false` above is a Next.js convention and this project is plain
// Vite, so the runtime may have consumed the stream anyway. Returns null when
// that happened, which the handler reports rather than silently failing on the
// signature.
async function rawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
  if (typeof req.body === 'string') return req.body;
  if (req.body && typeof req.body === 'object') return null;
  let data = '';
  for await (const chunk of req) data += chunk;
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const signature = req.headers['paddle-signature'] ?? '';
  const secret = process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET ?? '';
  const body = await rawBody(req);
  if (!signature) return res.status(400).json({ error: 'missing_signature' });
  if (body === null) return res.status(500).json({ error: 'body_already_parsed' });
  if (!body) return res.status(400).json({ error: 'empty_body' });
  if (!secret) return res.status(500).json({ error: 'webhook_secret_missing' });

  try {
    // Throws on a bad signature, an expired timestamp or a malformed event.
    const event = await getPaddle().webhooks.unmarshal(body, secret, signature);
    if (event?.eventType !== 'transaction.completed') {
      return res.status(200).json({ received: true, ignored: true });
    }

    const tx = event.data ?? {};
    const userId = tx.customData?.userId;
    const productId = (tx.items ?? [])
      .map((item) => PRODUCT_BY_PRICE[item?.price?.id])
      .find(Boolean);

    // A completed transaction we can't attribute is not worth retrying —
    // retries would replay the same unattributable payload for three days.
    if (!userId || !productId) {
      return res.status(200).json({ received: true, unattributed: true });
    }

    const { error } = await admin()
      .from('purchases')
      .upsert({
        user_id: userId,
        product_id: productId,
        provider: 'paddle',
        order_id: tx.id ?? null,
        buyer_email: tx.customer?.email ?? null,
      }, { onConflict: 'user_id,product_id', ignoreDuplicates: true });
    if (error) throw error;

    return res.status(200).json({ received: true });
  } catch (e) {
    // Non-2xx so Paddle retries: a rotated secret or a transient DB error
    // should not silently drop a paid transaction.
    console.error('paddle webhook:', e?.message || e);
    return res.status(500).json({ error: 'internal' });
  }
}
