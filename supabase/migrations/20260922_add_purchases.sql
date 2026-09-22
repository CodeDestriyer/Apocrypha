-- Paid access to course PDFs. Rows are written only by the service role
-- (api/redeem.js after Gumroad verifies the license); clients can read their
-- own rows so the UI knows whether to ask for the full file.
create table if not exists public.purchases (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  product_id  text not null,
  provider    text not null default 'gumroad',
  license_key text,
  order_id    text,
  buyer_email text,
  created_at  timestamptz not null default now(),
  unique (user_id, product_id)
);

-- One licence key unlocks one account: the redeem endpoint leans on this
-- conflict instead of Gumroad's uses counter, which it never increments.
create unique index if not exists purchases_provider_license_key
  on public.purchases (provider, license_key)
  where license_key is not null;

alter table public.purchases enable row level security;

drop policy if exists "purchases_select_own" on public.purchases;
create policy "purchases_select_own" on public.purchases
  for select using (auth.uid() = user_id);
