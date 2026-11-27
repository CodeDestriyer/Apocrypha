-- Shared takes: one card snapshotted under a random token, readable by anyone
-- who has the token. Course text is otherwise buyers-only, so:
--   * create_share() copies the card from course_content itself (the client
--     can't hand in its own text), and only for buyers/admins;
--   * there is no select policy — get_share() returns one row by token, so the
--     table can't be listed to reassemble the course.
create table if not exists public.shares (
  token      text primary key,
  product_id text not null,
  card_id    text not null,
  card       jsonb not null,
  auto       int not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (product_id, card_id, created_by)
);
alter table public.shares enable row level security;

create or replace function public.create_share(p_product text, p_card text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_card jsonb;
  v_auto int;
  v_token text;
begin
  if auth.uid() is null then raise exception 'unauthenticated'; end if;
  if not (public.is_admin() or exists (
    select 1 from purchases where user_id = auth.uid() and product_id = p_product
  )) then raise exception 'forbidden'; end if;

  select token into v_token from shares
   where product_id = p_product and card_id = p_card and created_by = auth.uid();
  if v_token is not null then return v_token; end if;

  -- Position across chapters = the viewer's auto-background index.
  select c, (row_number() over (order by co, o) - 1)::int
    into v_card, v_auto
    from course_content cc,
         jsonb_array_elements(cc.content->'chapters') with ordinality as ch(chapter, co),
         jsonb_array_elements(ch.chapter->'cards') with ordinality as x(c, o)
   where cc.product_id = p_product
   order by (c->>'id' = p_card) desc, co, o
   limit 1;
  if v_card is null or v_card->>'id' is distinct from p_card then raise exception 'not_found'; end if;

  v_token := substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);
  insert into shares (token, product_id, card_id, card, auto, created_by)
  values (v_token, p_product, p_card, v_card, v_auto, auth.uid());
  return v_token;
end $$;

create or replace function public.get_share(p_token text)
returns table (product_id text, card jsonb, auto int)
language sql stable security definer set search_path = public as $$
  select product_id, card, auto from shares where token = p_token;
$$;

revoke all on function public.create_share(text, text) from public, anon;
grant execute on function public.create_share(text, text) to authenticated;
grant execute on function public.get_share(text) to anon, authenticated;
