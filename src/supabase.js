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
  { key: 'ЛОВ', label: 'Ловкость',  value: 5 },
  { key: 'ИНТ', label: 'Интеллект', value: 5 },
  { key: 'ХАР', label: 'Харизма',   value: 5 },
];

const DEFAULT_SKILLS = [
  { name: 'Чтение',           level: 1, xp: 20 },
  { name: 'Спорт',            level: 1, xp: 45 },
  { name: 'Программирование', level: 2, xp: 10 },
  { name: 'Медитация',        level: 0, xp: 0  },
];

export async function ensureSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.session;
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
  return data;
}

export async function createProfile(name) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user');
  const row = {
    id: user.id,
    name,
    avatar_idx: 0,
    stats: DEFAULT_STATS,
    skills: DEFAULT_SKILLS,
    goals: [],
    asceses: [],
    moneymaxing: [],
    looksmaxing: [],
  };
  const { data, error } = await supabase
    .from('profiles')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
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
