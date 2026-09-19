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
  - `RulesSection.jsx` — Reglas: Spanish grammar rules in nested folders.
- `SaludSection.jsx` — hub over Peso + Hábitos.
  - `PesoSection.jsx` / `weightChart.jsx` / `WeightRuler.jsx` — weight tracking.
  - `HabitosSection.jsx` — quit-counters.
- `FinanzasSection.jsx` — account balances in EUR.
- `ConocimientoSection.jsx` — the personal knowledge base (thoughts, things
  understood) in nested folders. A SEPARATE section from Reglas on purpose: the
  two hold different material and are free to diverge in layout, copy and
  features. Neither is expected to keep in step with the other.
- `BodySection.jsx` — Cuerpo tab: built and routable, but no nav entry points
  to it right now (see the commented-out entry in `CharacterPage.jsx`).
- `SubPage.jsx` — shared header/back chrome for the sub-screens above.

Shared between the two notes sections — narrow, generic pieces only, none of
which constrains how a section looks or behaves:
- `richText.jsx` — the stored marker format (`**bold**`, `[[box]]`, fenced
  blocks, tables) and its renderer.
- `noteTree.js` — folder-tree algebra: pure functions over the layout tree.
- `RichEditor.jsx` — the WYSIWYG editor for that format. Its toolbar labels live
  under `fmt.*` in i18n; each section owns its own label namespace otherwise.

Shared infrastructure (auth, profile, i18n) lives one level up in `../` and is
used by both apps.
