-- Conocimiento (Héroe › Conocimiento): the personal knowledge base. It reuses
-- the Reglas engine, so it mirrors that column trio exactly, one set per
-- section, keeping the two bodies of text fully independent:
--   notes        — list of { id, title, body, groupId, created_at }
--   note_groups  — list of { id, name } (the folders)
--   note_layout  — the nested tree of { t: 'r' | 'g', id, children? }
-- Without these columns the profile UPDATE silently fails and nothing the
-- Conocimiento tab writes is ever persisted.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notes       jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS note_groups jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS note_layout jsonb NOT NULL DEFAULT '[]'::jsonb;
