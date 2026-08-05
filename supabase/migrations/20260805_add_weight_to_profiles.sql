-- Cuerpo (Body) tab: weight tracking. Same JSON-on-the-profile-row pattern as
-- decks/goals/etc. weight_log is a list of { id, weight, date, created_at }
-- (newest first). weight_goal is a single optional target weight (kg).
-- Without these columns the profile UPDATE/INSERT silently failed and nothing
-- the Body tab wrote was ever persisted.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weight_log  jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS weight_goal real;
