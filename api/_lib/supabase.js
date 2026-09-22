// Service-role Supabase client for the serverless functions. Kept out of the
// route tree by the leading underscore — Vercel ignores `api/_*`.
import { createClient } from '@supabase/supabase-js';

let client = null;

export function admin() {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('supabase_env_missing');
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

// Resolves the caller from the `Authorization: Bearer <access_token>` header.
export async function userFromRequest(req) {
  const header = req.headers?.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  const { data, error } = await admin().auth.getUser(token);
  return error ? null : (data?.user ?? null);
}
