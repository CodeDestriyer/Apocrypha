import { supabase } from '../supabase.js';

export async function isAdmin() {
  const { data, error } = await supabase.rpc('is_admin');
  return !error && data === true;
}

export async function loadCourseAdmin(productId) {
  const [draft, live] = await Promise.all([
    supabase.from('course_drafts').select('content').eq('product_id', productId).maybeSingle(),
    supabase.from('course_content').select('content').eq('product_id', productId).maybeSingle(),
  ]);
  if (draft.error) throw draft.error;
  if (live.error) throw live.error;
  const published = live.data?.content ?? null;
  return { draft: draft.data?.content ?? published ?? { chapters: [] }, published };
}

export async function saveDraft(productId, content) {
  const { error } = await supabase
    .from('course_drafts')
    .upsert({ product_id: productId, content, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function publishCourse(productId, content) {
  const { error } = await supabase
    .from('course_content')
    .upsert({ product_id: productId, content, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export async function uploadMedia(productId, file) {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const path = `${productId}/${Date.now().toString(36)}.${ext}`;
  const { error } = await supabase.storage.from('course-media').upload(path, file, { contentType: file.type });
  if (error) throw error;
  return supabase.storage.from('course-media').getPublicUrl(path).data.publicUrl;
}
