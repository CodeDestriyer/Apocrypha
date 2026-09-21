insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('courses', 'courses', false, 26214400, array['application/pdf'])
on conflict (id) do nothing;

-- Teaser: the first few pages, readable by anyone (signed URL, no session needed).
create policy courses_preview_read on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'courses' and name like '%/preview.pdf');

-- Full book: only a real (non-anonymous) account can sign a URL for it.
create policy courses_full_read on storage.objects for select
  to authenticated
  using (
    bucket_id = 'courses'
    and name like '%/full.pdf'
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );
