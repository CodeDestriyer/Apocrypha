-- The full book is a paid product now. The previous policy let any registered
-- account sign a URL for it straight from the browser, which is a free copy for
-- anyone who signs in with Google — the sign-up gate it was written for predates
-- the paywall.
--
-- api/book.js signs with the service role and checks `purchases` itself, so this
-- policy is defence in depth: the database refuses the full file to a client that
-- has not paid, whatever the app happens to call.
drop policy if exists courses_full_read on storage.objects;

create policy courses_full_read on storage.objects for select
  to authenticated
  using (
    bucket_id = 'courses'
    and name like '%/full.pdf'
    and exists (
      select 1 from public.purchases p
      where p.user_id = auth.uid()
        and p.product_id = split_part(storage.objects.name, '/', 1)
    )
  );
