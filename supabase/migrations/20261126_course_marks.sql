-- Liked / saved course cards: { "<product_id>": { liked: [cardId], saved: [cardId] } }.
alter table public.profiles add column if not exists course_marks jsonb not null default '{}'::jsonb;
