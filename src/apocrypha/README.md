# Apocrypha — gamification app

Everything in this folder belongs to **Apocrypha**, the private RPG-style
gamification app (character sheet, XP, flashcard decks, body/weight tracking).

It is *not* part of the public Varkanis site (see `../varkanis/`). Apocrypha is
reached only through the hidden shortcut — a registered user taps their avatar
on the landing page 10× — and is rendered by `Shell` in `../App.jsx`.

Modules:
- `CharacterPage.jsx` — character sheet, avatar, XP badge, module nav grid.
- `CardsSection.jsx` — spaced-repetition flashcard decks.
- `BodySection.jsx` — Cuerpo tab: log your weight.
- `CharacterModel.jsx` — the 3D `.glb` character viewer.
- `SubPage.jsx` — shared header/back chrome for the sub-screens above.

Shared infrastructure (auth, profile, i18n) lives one level up in `../` and is
used by both apps.
