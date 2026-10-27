# Standard protocol: additional module creation

Use this when a student exhausts a field (admin **Modules needed** / Cursor prompt) or when a planned tree branch must go live. One new module per iteration. Do not invent a textbook in advance.

## 1. Trigger (when to write)

Write a module only when at least one of these is true:

1. Admin **Modules needed** lists a `nextStrandId` with students waiting.
2. A field sitting is complete (every question answered; every miss has a written repair) and the next strand has no items yet.
3. A tree node is `planned` / empty and a held parent (or domain container) has opened a clear need — prefer interest + exhaustion over speculation.

Do **not** write from interest ticks alone. Interests are a register only.

| Sitting result | Next module |
| --- | --- |
| Did not hold (`matched` &lt; `ceil(5n/6)` on choice items) | **Same field, same difficulty** — a training set for the listed weak ideas; do not deepen past an unheld weak set |
| Held | **Two tracks:** (1) **Deepen** — harder module in the same field (`…-depth-n`); (2) **Width** — lateral leaf with its own `field` (prefer an empty child on the tree, else add a sibling). Modules needed lists both gaps. |

Research / essay items count for completion but **not** toward the 5-of-6 hold score.

On finish, the app shows a clear learning-level / NCEA-depth reference for the module’s `ageTier` (reference only; not an award). Sophia can also rate difficulty on a 1–5 slider (`pace/{uid}/{fieldId}`) so later deepen/practice steps can ease or raise pace.

The map tracks **depth** (down a field) and **width** (sibling leaves). One Cursor iteration still writes one strand; copy one Modules needed row at a time.

The student home is the University Entrance ramp first (literacy, numeracy, school science, and switched-on pathway subjects). Year 11 university-intro 101s live under **Additional fields**. Do not pull 101 content into an entrance-ramp prompt unless the field’s tree node is `wing: "additional"`. This project is Sophia-only with Warwick as admin.

## 2. Copy the prompt

1. Sign in as parent → **Modules needed** (or student page → Cursor prompts).
2. Copy the production prompt for that row. It already names student uid, field, mode, misses, and `Next strand id`.
3. Paste into Cursor. Prefer one strand per session.

The prompt is computed in-app (`lib/expansion.mjs`). It is not stored in the database and is not emailed.

## 3. Identity rules (never break)

| Rule | Detail |
| --- | --- |
| Strand id | Use the prompt’s `nextStrandId` exactly. Do not rename existing strands. |
| Item ids | New, stable, unique across the whole catalogue. Never reuse or rename live ids. |
| Field | Same `field` as the exhausted sitting (unless opening an explicit new tree leaf with its own field). |
| `continues` | Point at the finished strand id (or `placement-check` for a first module). |
| Database paths | Do not invent new roots. Guides stay under `guides/{itemId}`, not on the public item. |
| Placement | Never edit `placement-check` item ids, predicts, or strand id. |

## 4. Strand shape

Add one strand object (typically in the content file that already owns that field):

| Property | Requirement |
| --- | --- |
| `id` | Exact `nextStrandId` |
| `title` / `summary` | Clear, student-facing |
| `role` | `"module"` |
| `depth` | Integer ≥ 2; deepen by raising depth when the sitting held |
| `ageTier` | One of `year9` … `year13` matching the intended tier |
| `field` | Claim / field id used by the tree and `fieldStudy` |
| `order` | After earlier strands in that field |
| `continues` | Prior strand id |
| `phase` / `domain` | Match neighbouring modules |

**Scope:** about **six choice questions** (allowed band **5–8** choice items). Optional **one** research/essay item after the choices (Helios-style) if the prompt needs a written case — research does not replace the six-choice hold band.

## 4b. Student voice (Year 10)

Sophia is about 15. Student-facing wording must read as clear Year 10 English:

- Full sentences a good teacher would say — not telegraphic exam headlines.
- Passages teach the idea; they must not sound like checklist advice about “how to work through questions”.
- Avoid internal product words on the student path (`sitting`, `hold`, `depth/width`, `cluster`) unless you explain them in plain language.
- Keep academic demand the same; clearer language is not easier content.
- Choice texts should be clear phrases of similar length; do not make the correct option obviously longest.

Admin Cursor prompts may stay terse. The student UI and every `prompt` / choice / `passage` / `followPrompt` must not.

## 5. Item shape (each choice probe)

```text
kind: "probe"
answerKind: "choice"
ideaId: usually same as item id (or a stable idea key)
strandId, claim/field, order, prompt
choices: exactly 4 { id, text }
answer: one of the choice ids
lookFor: lines for parent / repair marking context
misconceptions: common wrong ideas (authoring notes)
passage: exactly two paragraphs (or rely on buildPassage)
followPrompt: different question, answerable from the passage alone
repairAccept: optional keywords for auto-mark of the written repair
```

Optional: `words` (term / meaning / example), `sourceId` (seeded under `sources/`).

### Choice quality (mandatory)

Validated by `lib/checkChoices.mjs` via `checkModules` / `checkContent`:

1. **Plausible distractors** — Year-appropriate misconceptions, never jokes or absurd giveaways.
2. **Length** — correct option must not be obviously longer/more “serious” than the shortest wrong option.
3. **Em-dash glosses** — if used, not only on the correct option (all four or none), except short taxonomy labels where every option uses `Label — gloss`.
4. **Phrasing diversity** — do not give two or more wrong answers the same locked opening (`Only…`, gerund stack, `It makes…`, etc.) unless the correct option shares that parallel form (e.g. all four are `x = …`). Mix sentence shapes so **style alone** does not mark the incorrect set.
5. **followPrompt** must not contain the correct choice text (case-insensitive).
6. **Passage** must not quote the correct choice text; two paragraphs; bury the idea.

Display order is shuffled by item id in the app — still write honest distractors; do not rely on “correct is always A”.

### Research / essay item (optional)

```text
kind: "research"
answerKind: "essay" | "paragraph"
no choices
prompt asks for extended writing
words / sourceId as needed
```

Student answer is stored on the attempt (`answer` string). Parent reviews separately; do not expect `matched: true` for hold.

## 6. Where to put the file

| Content | File |
| --- | --- |
| Year 9–10 core / science / English / maths | `content/modules.mjs` or `content/modules-part2.mjs` |
| Helios Management 101 | `content/modules-helios.mjs` |
| Year 11 university-path 101s | `content/modules-university.mjs` |
| Post-hold deepen + lateral width | `content/modules-depth-width.mjs` |
| New family of modules | New `content/modules-….mjs` **and** wire it into `scripts/seed-placement-check.js` |

If the tree needs a new leaf or a `planned` → `live` flip, edit `content/knowledge-tree.mjs` (symbol, parent, summary). Interest options derive from the tree on seed.

## 7. Validate before seed

From repo root:

```bash
npm test
```

Authoring checks that must stay green:

- `checkModules` (structure, passages, choices, continues)
- `checkChoices` (telegraphing / distractor cliques)
- `checkKnowledgeTree` if the tree changed
- `moduleScopeIssues` (5–8 choice questions per domain module; placement / decision-context exceptions)

Fix every error before committing.

## 8. Ship

1. Commit content (+ tree/seed wiring if needed).
2. Push `main` — CI / seed writes `strands`, `items`, `guides`, and `catalog/tree` (and `sources/*` when applicable).
3. Do **not** hand-edit live questions in the Firebase console except emergencies.
4. Confirm the waiting student can open the field again; **Modules needed** row should clear once items exist for that `nextStrandId`.

## 9. Cursor agent checklist (paste-friendly)

```text
1. Use the admin Modules-needed prompt as the brief (uid, field, held/same, nextStrandId, misses).
2. Add one strand + ~6 choice items; optional one research item only if needed.
3. Same field; continues = finished strand; never rename live ids.
4. If held: deepen and broaden; list core already covered. If not held: same difficulty; teach missed ideas.
5. Distractors: plausible, similar length, varied sentence openings — no joke clique.
6. Guide: two-paragraph passage + followPrompt; no correct-choice leak; no external links on the miss path.
7. Update knowledge-tree if a new/planned branch is involved.
8. Wire new content file into seed-placement-check.js if you created one.
9. npm test must pass; then commit and push to seed.
10. This does not award NCEA.
```

## 10. Anti-patterns

- Writing Module II–V for six fields because they “might” be needed
- Parallel wrong answers that all start with `Only…` / the same gerund / `It makes…`
- Correct option twice as long as distractors
- Restating the previous module’s items with synonym swaps after a hold
- Deepening after a failed hold
- Changing placement-check or renaming live item ids
- Putting answers or passages on the public item record

## Related contracts

| Doc / code | Role |
| --- | --- |
| `plan.md` | Learner, calendar, hold rule, deepening intent |
| `database.md` | Paths, rights, management item id stability |
| `lib/expansion.mjs` | Prompt text, hold math, Modules needed aggregation |
| `lib/checkModules.mjs` / `lib/checkChoices.mjs` | Automated quality gates |
| `content/knowledge-tree.mjs` | Student map |
| `scripts/seed-placement-check.js` | Git → Realtime Database |
