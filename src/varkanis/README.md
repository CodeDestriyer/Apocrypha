# Varkanis — psychology project (public site)

Everything in this folder belongs to **Varkanis**, the public, Spanish-only
psychology project: the landing page, the psychological tests, and the courses.

It is *not* part of the Apocrypha gamification app (see `../apocrypha/`). This is
what every visitor sees first, rendered by `Shell` in `../App.jsx` via `Landing`.

Modules:
- `Landing.jsx` — public home, account menu, register/profile modals, courses (PDF reader).
- `tests/data.js` — test definitions and scoring.
- `tests/TestRunner.jsx` — the test-taking UI and results.

Shared infrastructure (auth, profile, i18n) lives one level up in `../` and is
used by both apps.
