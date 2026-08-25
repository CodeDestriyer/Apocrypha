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
