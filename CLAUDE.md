# Agent instructions for this repo

## Style / tone (read this)

The user is not dumb — don't over-explain. No hand-holding copy in the UI:
skip empty-state prose ("you don't have any X yet, add one…"), onboarding
hints, and captions that state the obvious. An empty list should just be
empty. Keep code comments lean too — comment the non-obvious *why*, not
every line. Prefer minimal, clean UI over explanatory text.

## Git push setup (important — read before pushing)

The user has two GitHub accounts on this machine:
- `botisystemua-cyber` — work account, currently logged into `gh` CLI. **Do not touch.**
- `CodeDestriyer` — personal account, owner of this repo.

`gh` CLI is authenticated as the work account. A naive `git push` via HTTPS will fail with 403 because credentials resolve to the work account.

This repo's `origin` remote uses an SSH host alias to bypass that:

```
origin  github-codedestriyer:CodeDestriyer/Apocrypha.git
```

The alias is defined in `~/.ssh/config` and uses `~/.ssh/id_ed25519_liferpg`, which is registered as an SSH key on the `CodeDestriyer` GitHub account.

**To push:** just `git push origin main`. It works.

**Do not:**
- Switch `gh auth` accounts.
- Change the remote URL back to `https://github.com/...` — push will break.
- Use `gh repo clone` for this repo (sets HTTPS remote). If re-cloning, use `git clone github-codedestriyer:CodeDestriyer/Apocrypha.git`.

If the SSH alias is missing (fresh machine), the config block is:

```
Host github-codedestriyer
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_liferpg
  IdentitiesOnly yes
```

Verify with: `ssh -T github-codedestriyer` — should greet as `CodeDestriyer`.

## Git identity for commits

Local repo config sets:
- `user.name`  = `botisystemua-cyber`
- `user.email` = `266281688+botisystemua-cyber@users.noreply.github.com`

That's fine — commits are authored by that identity, but pushed via the personal SSH key, which is what GitHub checks for permissions. If the user prefers commits attributed to `CodeDestriyer`, swap to that account's noreply email via `git config user.email ...` (local only — never `--global`).

## Deployment

Connected to Vercel. Push to `main` triggers auto-deploy at https://www.varkanis.com/.

**Work lands on `main`.** Default flow for this repo: finish the change,
commit, merge to `main`, `git push origin main`. Don't leave finished work
parked on a feature branch waiting for a merge request — the user wants it
deployed. Feature branches are fine as a staging area mid-task, but the task
isn't done until `main` has it.

## Paid content (Paddle)

The book is sold through Paddle, which is the merchant of record — it collects
VAT and pays out, so no company or VAT registration is needed on our side.

Flow: sign in -> `Paddle.Checkout.open()` with the Supabase user id in
`customData` -> Paddle posts `transaction.completed` to `api/paddle-webhook.js`
-> a row lands in `purchases` -> `api/book.js` signs a URL for `full.pdf`.

Which product was paid for is resolved from the **price id server-side**, never
from `custom_data` — that field comes from the browser. Storage RLS
(`courses_full_read`) independently requires a `purchases` row, so the database
refuses the full file even if a client tries to sign it directly.

Env vars on Vercel (Production). Changing any of them needs a redeploy, since
the `VITE_` ones are baked into the bundle at build time:

    SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY
    PADDLE_API_KEY
    PADDLE_ENV                              sandbox | production
    PADDLE_NOTIFICATION_WEBHOOK_SECRET      per notification destination
    PADDLE_PRICE_MENTES_BAJO_CONTROL        pri_...
    VITE_PADDLE_CLIENT_TOKEN
    VITE_PADDLE_ENV                         must match PADDLE_ENV
    VITE_PADDLE_PRICE_MENTES_BAJO_CONTROL   same pri_...

Sandbox and live are separate Paddle accounts with their own catalog, keys and
notification destinations. Nothing carries over between them.

## Profile data / Supabase note

User profiles (stats, skills, goals, etc.) are stored in Supabase. `DEFAULT_STATS` in `src/supabase.js` only applies on profile **creation** — changing labels there does not update existing rows. `loadProfile()` runs a `reconcileStats()` migration on read that normalizes existing profiles to current defaults (preserving values by position). When renaming/reordering stats, update `DEFAULT_STATS` and the migration handles the rest on next page load.
