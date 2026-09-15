-- Finanzas (Héroe › Finanzas): cash / bank account balances. Same
-- JSON-on-the-profile-row pattern as decks/goals/weight_log. `finances` is a
-- list of { id, name, type: 'cash' | 'bank', bank, amount, created_at }.
-- Single currency (EUR); the section sums `amount` into a total balance.
-- Without this column the profile UPDATE/INSERT silently fails and nothing the
-- Finanzas tab writes is ever persisted.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS finances jsonb NOT NULL DEFAULT '[]'::jsonb;
