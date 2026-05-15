# Agent instructions for this repo

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

Connected to Vercel. Push to `main` triggers auto-deploy at https://apocrypha-ochre.vercel.app/.

## Profile data / Supabase note

User profiles (stats, skills, goals, etc.) are stored in Supabase. `DEFAULT_STATS` in `src/supabase.js` only applies on profile **creation** — changing labels there does not update existing rows. `loadProfile()` runs a `reconcileStats()` migration on read that normalizes existing profiles to current defaults (preserving values by position). When renaming/reordering stats, update `DEFAULT_STATS` and the migration handles the rest on next page load.
