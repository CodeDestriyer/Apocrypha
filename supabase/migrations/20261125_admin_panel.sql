-- Author panel (#panel): edit card courses and test texts from the site.

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;
-- No policies: the table is only read through is_admin().

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- Course drafts live apart from course_content: buyers can read their
-- course_content row, so a draft column there would leak unpublished text.
create table if not exists public.course_drafts (
  product_id text primary key,
  content    jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.course_drafts enable row level security;
drop policy if exists course_drafts_admin on public.course_drafts;
create policy course_drafts_admin on public.course_drafts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists course_content_admin_read on public.course_content;
create policy course_content_admin_read on public.course_content
  for select to authenticated using (public.is_admin());
drop policy if exists course_content_admin_write on public.course_content;
create policy course_content_admin_write on public.course_content
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Test text overrides: { "<dot.path>": "text" } applied over tests/data.js.
-- Tests are public, so these are too.
create table if not exists public.test_texts (
  test_id    text primary key,
  texts      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.test_texts enable row level security;
drop policy if exists test_texts_read on public.test_texts;
create policy test_texts_read on public.test_texts for select using (true);
drop policy if exists test_texts_admin on public.test_texts;
create policy test_texts_admin on public.test_texts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Images/GIFs for course cards. Public, like /public/courses/ was.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('course-media', 'course-media', true, 15728640,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'])
on conflict (id) do nothing;

drop policy if exists course_media_admin_write on storage.objects;
create policy course_media_admin_write on storage.objects
  for insert to authenticated with check (bucket_id = 'course-media' and public.is_admin());
drop policy if exists course_media_admin_update on storage.objects;
create policy course_media_admin_update on storage.objects
  for update to authenticated using (bucket_id = 'course-media' and public.is_admin());
drop policy if exists course_media_admin_delete on storage.objects;
create policy course_media_admin_delete on storage.objects
  for delete to authenticated using (bucket_id = 'course-media' and public.is_admin());

-- Admins are added by hand (SQL editor): insert into public.admins (user_id) values ('<auth uid>');
