-- Anki-like flashcards (prototype). Decks live as JSON on the profile row,
-- same pattern as goals/skills/asceses. Each deck: { id, name, created_at, cards: [...] }.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS decks jsonb NOT NULL DEFAULT '[]'::jsonb;
