import { supabase } from '../../supabase.js';
import { TESTS } from './data.js';

// Test wording can be edited from #panel. Overrides live in Supabase
// `test_texts` as { "<dot.path>": "text" } and are written over the objects in
// data.js in place, so TestRunner and the scoring code need no changes.
// Paths are positional: reordering items in data.js moves overrides with them.

const SKIP_KEYS = new Set(['id', 'scale', 'logo', 'images', 'subscale', 'archetype', 'url', 'upsell', 'author']);

function leaves(obj, prefix = '', out = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (SKIP_KEYS.has(k)) continue;
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') {
      if (!/^(\/|https?:)/.test(v)) out.push(path);
    } else if (v && typeof v === 'object') {
      leaves(v, path, out);
    }
  }
  return out;
}

function get(obj, path) {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

function set(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const parent = keys.reduce((o, k) => o?.[k], obj);
  if (parent && typeof parent[last] === 'string') parent[last] = value;
}

export const EDITABLE_TESTS = TESTS.filter((t) => !t.url);

// Snapshot before any override is applied.
const ORIGINAL = Object.fromEntries(EDITABLE_TESTS.map((t) => [
  t.id,
  Object.fromEntries(leaves(t).map((p) => [p, get(t, p)])),
]));

export const originalTexts = (testId) => ORIGINAL[testId] ?? {};

const current = {};
export const currentOverrides = (testId) => current[testId] ?? {};

export function applyTestTexts(testId, texts) {
  const test = EDITABLE_TESTS.find((t) => t.id === testId);
  if (!test) return;
  const orig = ORIGINAL[testId];
  // Reset first so a removed override falls back to data.js.
  for (const [p, v] of Object.entries(orig)) set(test, p, v);
  for (const [p, v] of Object.entries(texts ?? {})) {
    if (p in orig && typeof v === 'string') set(test, p, v);
  }
  current[testId] = texts ?? {};
}

export async function loadTestTexts() {
  const { data, error } = await supabase.from('test_texts').select('test_id, texts');
  if (error) throw error;
  (data ?? []).forEach((r) => applyTestTexts(r.test_id, r.texts));
}

export async function saveTestTexts(testId, texts) {
  const { error } = await supabase
    .from('test_texts')
    .upsert({ test_id: testId, texts, updated_at: new Date().toISOString() });
  if (error) throw error;
  applyTestTexts(testId, texts);
}
