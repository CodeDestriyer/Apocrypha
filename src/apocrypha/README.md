# Apocrypha — personal tracking app

Everything in this folder belongs to **Apocrypha**, the private self-tracking
app: daily tasks, flashcard decks, grammar rules, habits, weight and finances.

It is *not* part of the public Varkanis site (see `../varkanis/`). Apocrypha is
reached via the `#apocrypha` (or `#app`) URL hash, and is always the entry point
when launched as an installed PWA. Both paths are handled by `Shell` in
`../App.jsx`.

Modules:
- `CharacterPage.jsx` — home screen: avatar, Peso/Tareas cubes, module nav grid.
- `TareasSection.jsx` — the per-day to-do list.
- `IdiomasSection.jsx` — hub over Tarjetas + Reglas.
  - `CardsSection.jsx` — flashcard decks (Leitner boxes, weighted draw).
  - `RulesSection.jsx` / `RuleEditor.jsx` — the shared notes engine: a tree of
    folders holding rich-text entries, with drag-to-nest, search and a read view.
    Mounted twice over two independent column sets, picked by a `config` prop:
    `REGLAS` (Spanish grammar, under Idiomas) and `CONOCIMIENTO` (the personal
    knowledge base, under Héroe). Labels fall back to the `reglas.*` strings, so
    a section only defines the copy that actually differs.
- `SaludSection.jsx` — hub over Peso + Hábitos.
  - `PesoSection.jsx` / `weightChart.jsx` / `WeightRuler.jsx` — weight tracking.
  - `HabitosSection.jsx` — quit-counters.
- `FinanzasSection.jsx` — account balances in EUR.
- Conocimiento — no file of its own: `RulesSection` with the `CONOCIMIENTO` config.
- `BodySection.jsx` — Cuerpo tab: built and routable, but no nav entry points
  to it right now (see the commented-out entry in `CharacterPage.jsx`).
- `SubPage.jsx` — shared header/back chrome for the sub-screens above.

Shared infrastructure (auth, profile, i18n) lives one level up in `../` and is
used by both apps.
