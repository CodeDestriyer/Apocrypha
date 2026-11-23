-- Card-based courses. The repo is public, so course text lives only here:
-- readable by accounts that bought the product, written only by the service
-- role (no insert/update policies).
create table if not exists public.course_content (
  product_id  text primary key,
  content     jsonb not null default '{"chapters": []}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.course_content enable row level security;

drop policy if exists course_content_read on public.course_content;
create policy course_content_read on public.course_content for select
  to authenticated
  using (
    exists (
      select 1 from public.purchases p
      where p.user_id = auth.uid()
        and p.product_id = course_content.product_id
    )
  );

-- Last card reached per course: { "<product_id>": <card index> }.
alter table public.profiles
  add column if not exists course_progress jsonb not null default '{}'::jsonb;
