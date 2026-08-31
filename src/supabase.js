import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: window.localStorage,
    storageKey: 'lr.auth',
  },
});

const DEFAULT_STATS = [
  { key: 'СИЛ', label: 'Сила',      value: 5 },
  { key: 'СТЙ', label: 'Стойкость', value: 5 },
  { key: 'ИНТ', label: 'Интеллект', value: 5 },
  { key: 'ХАР', label: 'Харизма',   value: 5 },
];

function reconcileStats(stats) {
  if (!Array.isArray(stats)) return { stats: DEFAULT_STATS, changed: true };
  const next = DEFAULT_STATS.map((def, i) => ({
    key: def.key,
    label: def.label,
    value: typeof stats[i]?.value === 'number' ? stats[i].value : def.value,
  }));
  const changed =
    stats.length !== next.length ||
    stats.some((s, i) => s.key !== next[i].key || s.label !== next[i].label);
  return { stats: next, changed };
}

const DEFAULT_SKILLS = [];

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function signInAnonymous() {
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function loadProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return data;
  const { stats, changed } = reconcileStats(data.stats);
  if (changed) {
    data.stats = stats;
    try {
      await supabase
        .from('profiles')
        .update({ stats, updated_at: new Date().toISOString() })
        .eq('id', user.id);
    } catch (e) {
      console.error('stats reconcile save failed', e);
    }
  }

  const goalsArr = Array.isArray(data.goals) ? data.goals : [];
  const legacyCal = goalsArr.filter((g) => g?.source === 'calendar');
  if (legacyCal.length) {
    const cleanedGoals = goalsArr.filter((g) => g?.source !== 'calendar');
    const dayPlans = Array.isArray(data.day_plans) ? data.day_plans : [];
    const moved = legacyCal.map((g) => ({
      id: g.id,
      title: g.title,
      day: String(g.deadline ?? '').slice(0, 10) || null,
      done: !!g.done,
      created_at: g.created_at ?? new Date().toISOString(),
    }));
    data.goals = cleanedGoals;
    data.day_plans = [...dayPlans, ...moved];
    try {
      await supabase
        .from('profiles')
        .update({ goals: data.goals, day_plans: data.day_plans, updated_at: new Date().toISOString() })
        .eq('id', user.id);
    } catch (e) {
      console.error('day_plans migration save failed', e);
    }
  }

  return data;
}

export async function createProfile(name) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');
  const row = {
    id: user.id,
    name,
    stats: DEFAULT_STATS,
    skills: DEFAULT_SKILLS,
    goals: [],
    asceses: [],
    moneymaxing: [],
    looksmaxing: [],
    menmaxing: [],
    decks: [],
    rules: [],
    rule_groups: [],
    rule_layout: [],
    habits: [],
    weight_log: [],
    weight_goal: null,
    tasks: [],
    test_results: [],
    xp: 0,
  };
  const { data, error } = await supabase
    .from('profiles')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  // Backfill `day` on tasks that predate the per-day feature. Without a stored
  // `day` a task drifts onto whatever day the app is opened; pin it to its
  // creation day (local) once, so it stays put from now on.
  const tasksArr = Array.isArray(data.tasks) ? data.tasks : [];
  const needsDay = tasksArr.some((tk) => tk && !tk.day);
  if (needsDay) {
    const localDay = (ts) => {
      const d = ts ? new Date(ts) : new Date();
      const src = Number.isNaN(d.getTime()) ? new Date() : d;
      return `${src.getFullYear()}-${String(src.getMonth() + 1).padStart(2, '0')}-${String(src.getDate()).padStart(2, '0')}`;
    };
    data.tasks = tasksArr.map((tk) =>
      tk && !tk.day ? { ...tk, day: localDay(tk.created_at) } : tk);
    try {
      await supabase
        .from('profiles')
        .update({ tasks: data.tasks, updated_at: new Date().toISOString() })
        .eq('id', user.id);
    } catch (e) {
      console.error('tasks day backfill save failed', e);
    }
  }

  return data;
}

export async function uploadLooksPhoto(file) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${user.id}/photo.${ext}?v=${Date.now()}`.split('?')[0];
  const { error } = await supabase.storage
    .from('looks')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from('looks').getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

// Flashcard back-side images live in the public `card-images` bucket, one
// folder per user (RLS keys writes to `auth.uid()` as the first path segment).
// The card only stores the resulting public URL in `card.backImage`.
const CARD_IMAGES_BUCKET = 'card-images';

const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export async function uploadCardImage(file) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');
  // Pasted blobs often have no filename, so derive the extension from the mime
  // type first and fall back to the name.
  const ext =
    MIME_EXT[file.type] ||
    (file.name?.split('.').pop() || 'jpg').toLowerCase();
  const rand = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2, 8);
  const path = `${user.id}/${rand}.${ext}`;
  const { error } = await supabase.storage
    .from(CARD_IMAGES_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from(CARD_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Best-effort cleanup: derive the storage path back out of a public URL and
// remove the object. Failures are swallowed — an orphaned image is harmless.
export async function deleteCardImage(url) {
  if (!url || typeof url !== 'string') return;
  const marker = `/${CARD_IMAGES_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  const path = decodeURIComponent(url.slice(idx + marker.length).split('?')[0]);
  if (!path) return;
  try {
    await supabase.storage.from(CARD_IMAGES_BUCKET).remove([path]);
  } catch (e) {
    console.error('card image delete failed', e);
  }
}

// ── Rule persistence: concurrency-safe merge ────────────────────────────────
// The three rule columns (rules, rule_groups, rule_layout) are whole-array JSON
// blobs. Writing them as a plain overwrite means a stale session (an old tab, a
// second device) can clobber rules another session added. To prevent that, rule
// saves go through a 3-way merge: `base` = what this session last saw synced
// with the DB, `mine` = this session's current copy, `theirs` = the row's live
// value fetched right before writing. Nothing is dropped unless this session
// deleted it (present in base, absent from mine); local edits win for items this
// session still has; items only another session has are kept.

export const RULE_COLUMNS = ['rules', 'rule_groups', 'rule_layout'];

// Fetch just the rule columns' live values (used as `theirs` in the merge).
export async function fetchRuleColumns() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');
  const { data, error } = await supabase
    .from('profiles')
    .select('rules, rule_groups, rule_layout')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data || { rules: [], rule_groups: [], rule_layout: [] };
}

// 3-way merge of an array of objects with a stable `id` (rules, rule_groups).
// This session's order and edits win: we keep `mine` as-is (so a local reorder
// survives the save), then append only the items another session added — those
// present in `theirs` but never in our synced baseline. Items in `base` but no
// longer in `mine` were deleted here and stay gone.
export function mergeArrayById(base, mine, theirs) {
  base = Array.isArray(base) ? base : [];
  mine = Array.isArray(mine) ? mine : [];
  theirs = Array.isArray(theirs) ? theirs : [];
  const baseIds = new Set(base.filter((x) => x && x.id != null).map((x) => x.id));
  const out = [];
  const placed = new Set();
  // Mine's items and order win (covers local reorders, edits and additions).
  for (const x of mine) {
    if (!x || x.id == null || placed.has(x.id)) continue;
    out.push(x);
    placed.add(x.id);
  }
  // Append items only another session has: in theirs, not in mine, and never in
  // our baseline (so it's a genuine remote add, not something we deleted).
  for (const t of theirs) {
    if (!t || t.id == null || placed.has(t.id)) continue;
    if (baseIds.has(t.id)) continue;          // deleted locally → honour deletion
    out.push(t);
    placed.add(t.id);
  }
  return out;
}

// 3-way merge of the layout array ({ t, id } entries, no editable fields).
// Same rule as mergeArrayById: mine's order wins so a local reorder isn't
// clobbered by the DB's order; remote-only entries are appended.
export function mergeLayout(base, mine, theirs) {
  const key = (e) => e.t + ':' + e.id;
  const valid = (e) => e && e.id != null && e.t != null;
  base = Array.isArray(base) ? base : [];
  mine = Array.isArray(mine) ? mine : [];
  theirs = Array.isArray(theirs) ? theirs : [];
  const baseKeys = new Set(base.filter(valid).map(key));
  const out = [];
  const placed = new Set();
  for (const e of mine) {
    if (!valid(e) || placed.has(key(e))) continue;
    out.push(e);
    placed.add(key(e));
  }
  for (const t of theirs) {
    if (!valid(t) || placed.has(key(t))) continue;
    if (baseKeys.has(key(t))) continue;       // deleted locally → honour deletion
    out.push(t);
    placed.add(key(t));
  }
  return out;
}

// Build a rule-column patch by merging the pending local values against the
// row's live DB values. `base`/`mine` are the synced baseline and current local
// copies of the whole profile.
export async function mergeRulePatch(patch, base, mine) {
  const theirs = await fetchRuleColumns();
  const b = base || {}, m = mine || {};
  return {
    ...patch,
    rules: mergeArrayById(b.rules, m.rules, theirs.rules),
    rule_groups: mergeArrayById(b.rule_groups, m.rule_groups, theirs.rule_groups),
    rule_layout: mergeLayout(b.rule_layout, m.rule_layout, theirs.rule_layout),
  };
}

// 3-way merge of the decks array. Decks merge by id like any other {id} array,
// but a deck also carries its own `cards` array — so for a deck that exists on
// both sides we recursively merge its cards by id (against the baseline deck's
// cards). That way two devices each adding cards to the SAME deck both keep
// their additions, instead of one device's whole deck object clobbering the
// other. Deck-level fields (name, etc.) follow the usual rule: mine wins.
export function mergeDecks(base, mine, theirs) {
  base = Array.isArray(base) ? base : [];
  mine = Array.isArray(mine) ? mine : [];
  theirs = Array.isArray(theirs) ? theirs : [];
  const byId = (arr) => new Map(arr.filter((x) => x && x.id != null).map((x) => [x.id, x]));
  const baseMap = byId(base);
  const theirsMap = byId(theirs);
  const baseIds = new Set(baseMap.keys());
  const out = [];
  const placed = new Set();
  // Mine's decks and order win; for decks also present remotely, merge cards.
  for (const d of mine) {
    if (!d || d.id == null || placed.has(d.id)) continue;
    const t = theirsMap.get(d.id);
    if (t) {
      const b = baseMap.get(d.id);
      out.push({ ...d, cards: mergeArrayById(b?.cards, d.cards, t.cards) });
    } else {
      out.push(d);
    }
    placed.add(d.id);
  }
  // Append decks only another session added (in theirs, never in our baseline).
  for (const t of theirs) {
    if (!t || t.id == null || placed.has(t.id)) continue;
    if (baseIds.has(t.id)) continue;            // deleted locally → honour deletion
    out.push(t);
    placed.add(t.id);
  }
  return out;
}

// Columns that get a 3-way merge on save instead of a blind overwrite, so
// concurrent edits from another device aren't clobbered. Each is an array of
// objects with a stable `id` (decks additionally nest cards; rule_layout uses a
// composite key).
export const MERGEABLE_COLUMNS = ['rules', 'rule_groups', 'rule_layout', 'tasks', 'decks'];

// Build a save patch by merging the pending local values of any mergeable column
// against the row's live DB values. Fetches only the columns actually touched.
// `base`/`mine` are the synced baseline and current local copies of the profile.
export async function mergeProfilePatch(patch, base, mine) {
  const touched = MERGEABLE_COLUMNS.filter((k) => k in patch);
  if (!touched.length) return patch;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');
  const { data, error } = await supabase
    .from('profiles')
    .select(touched.join(', '))
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  const theirs = data || {};
  const b = base || {}, m = mine || {};
  const out = { ...patch };
  for (const k of touched) {
    if (k === 'rule_layout') out[k] = mergeLayout(b[k], m[k], theirs[k]);
    else if (k === 'decks') out[k] = mergeDecks(b[k], m[k], theirs[k]);
    else out[k] = mergeArrayById(b[k], m[k], theirs[k]); // rules, rule_groups, tasks
  }
  return out;
}

export async function saveProfile(patch) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
