# Sophia plan

This is the research and creation plan named in `sophiaplam.md`. That file stays the scope. This file says who the study is for, in what order ideas are taught, and when building the site is allowed to start. The database contract is `database.md`. Paths in that file are the ones to build against.

Sophia is 15. In October 2026 she is still in Year 10 work, not in an NCEA year. Mathematics: the Year 10 Start Right project book is complete. English: she is halfway through the Year 10 Start Right course. Her homeschool work already includes basic essays and presentations. General science is well behind. Psychology and social management are ahead of the rest. She wants to understand Management 101, and she wants to walk through the Helios Energy essay in `sources/helios-strategic-execution.md`.

The site is the place that study happens. It is a React app with two logins and the Firebase Realtime Database already created for `sophia-138fe`. A session starts with a question. Long text stays collapsed. The screen is bezels: question, answer, research, words, and a parent note.

## What this plan is protecting

The course order and the database paths are fixed here so the app is not rebuilt around a different learner or a different tree. Question wording can change. A path name, a strand id, or a management item id should not.

Her father's books are part of what she should eventually understand. They set content gates and the tone of the screen. They do not add a strand, and they do not change a path or an item id. The manuscripts stay out of this repository. The section Father's texts records which understandings can be named in 2026 and which texts wait.

## What Sophia is not

Sophia does not award NCEA or University Entrance. Practice on the site is labeled as practice. A link school, or Te Kura from age 16, is how a real assessment is entered. No school is obliged to be the link school.

She is under 16, so home education needs a Ministry of Education Certificate of Exemption under section 38 of the Education and Training Act 2020 until she turns 16. Whether that certificate is already in force is still unknown. Her birthday is unknown, so the date she turns 16 is unknown.

The site is not Te Kura, and it is not a school for other families. The database is Realtime Database, not Firestore.

## Where she is

| Area | October 2026 | What that means for the course |
| --- | --- | --- |
| Mathematics | Year 10 Start Right project book finished | Check that it still holds. Do not open a new mathematics course until that check is done |
| English | Halfway through Year 10 Start Right | Finish that course. Essays and presentations stay the usual way she answers |
| Geology | Very poor | Earth science comes after she can use evidence and a little chemistry |
| Chemistry | pH and basic ion behaviour only | Continue from particles, ions, and pH. Do not start an NCEA chemistry course |
| Biology | Very poor | Cells first, then systems |
| Physics | Extremely poor | Force, motion, and energy are the first science teaching, after claims and evidence |
| History, politics, technology | Poor | Taught only when a management case needs them, not as three extra textbooks |
| Psychology | Advanced | A strength. In 2026 the names are the four distinctions in Father's texts. The vocabulary is still treated as something to test |
| Social management | Advanced | A strength in reading people and situations. Management 101 still has to be learned as theory |
| Management | Keen to go ahead | First interest strand. The Helios essay is the worked case |

An NZQA Record of Achievement, if one exists, can override this table. Nothing in the placement says she already has NCEA credits. Treat the literacy and numeracy co-requisite as not yet met until a record says it is.

## The three calendar years

Senior NCEA years do not start in Term 4 of 2026. She has Year 10 work open, and science is behind Year 10.

| When | School year | Aim |
| --- | --- | --- |
| Term 4, 2026, about eight weeks | Finish Year 10 | Hold mathematics. Finish the English course. Start science at claims and physics. Walk the Helios tools. |
| 2027 | Year 11 | NCEA Level 1 only where the foundation holds. English, mathematics for the numeracy co-requisite, and the start of a business or psychology pathway. Science Level 1 waits until the foundation probes are known. |
| 2028 | Year 12 | NCEA Level 2, including the start of University Entrance reading and writing. |

NCEA Level 3 and University Entrance sit in 2029 if this pace holds. Putting them into 2028 would skip the science gap and the unfinished Year 10 English. That is the rebuild this plan is avoiding.

Each NCEA certificate needs 60 credits at that level or above, plus a one-off co-requisite of 10 literacy or te reo matatini credits and 10 numeracy or te pāngarau credits. Through 2027 the co-requisite can also be met by approved standards inside subjects. From 2028 only the dedicated standards count. University Entrance additionally needs Level 3, 14 Level 3 credits in each of three approved subjects, and its own reading, writing, and numeracy lists. Sources are at the end of this file.

Likely later homes for her interests, not courses to start now: Business Studies for management, Psychology for internal processes, English for University Entrance literacy. Standard numbers are chosen from the NZQA lists when 2027 planning starts, not before the foundation probes exist.

## The learning loop

Every topic is a test before it is a lesson.

1. She already has the idea. Record it and do not teach it from the start.
2. She does not. The failed check becomes research: look outside the page, compare more than one option, and judge.

Words are part of the hard question. A term she needs is shown with a plain definition and one example. A later question asks her to use it. The Helios essay's words are the first set: macro-environment, strength, weakness, opportunity, threat, incentive, intrinsic motivation.

The loop for one idea:

1. Probe, with no lesson above it.
2. Result: known, partial, or unknown. Partial gets one short repair and a new question. Unknown opens research.
3. Research brief: one question, at least two sources or two real options, the words she must use, a judgement in her own sentences.
4. Retest with a new question that needs the same idea.
5. Parent review. The parent sets the result. Opening a panel is not mastery.

Essays and presentation outlines are ordinary answers. A probe can ask for a sentence, a paragraph, an essay, or a presentation.

## Weekly shape for Term 4

Four blocks, so science and management are both real and English does not stop.

1. English. The next section of the Year 10 Start Right course. The output is a paragraph, a short essay, or a few presentation slides.
2. Management. The next Helios probe in `database.md`. One idea only.
3. Science. The current foundation strand. One probe only. Order is claims, then physics, then chemistry from ions and pH, then biology, then earth science.
4. The people strand inside management. When the item is about Leading, use her psychology and social management strength. Ask her to distinguish a pay incentive from intrinsic motivation before treating the idea as known. Projection against fact, and a need against a vice, belong to `psychology-insight` when that strand is built. They are labels for processes she already notices.

Mathematics gets one check in the first fortnight, drawn from the completed project book. If it holds, mathematics stops there until 2027. If a part fails, only that part reopens.

History, politics, and technology appear when a PESTEL probe needs a fact she does not have. That probe becomes research. They do not become separate courses in 2026.

## The screen

Five bezels.

| Bezel | Holds | Opens |
| --- | --- | --- |
| Question | The probe or retest | Always |
| Answer | Sentence, paragraph, essay, or presentation | With the question |
| Research | Sources, comparison, judgement | After a gap |
| Words | The few terms this question needs | When the question depends on them |
| Parent | The review note | After the parent sends it |

Anything longer than the question starts collapsed. The Helios essay is a source she opens from a research or walkthrough bezel. It is not sitting above the first probe.

The first time she logs in, the screen is a placement check: multiple-choice questions that validate or invalidate the October 2026 notes. She can leave and continue later. Answered questions stay answered. When every question has an attempt, the screen says, claim by claim, whether the note held. A majority of single-level claims must fit. English and chemistry are split notes, so they hold only when the earlier questions and the later question both fit. After that check is complete, the first screen of ordinary study is the next probe. Sovereign of Mind contains its own self-reviews. Those stay in the book. This check stays the October notes.

## Study modules

The placement check is depth 1, a survey across fields. Later study is short modules, one field at a time. A finished section is what allows the next module. A section is finished only when every question has a first attempt and every miss has a written repair.

The parent login then shows three things.

- A depth chart. Each field has a depth, which is how many modules in that field are finished. The bar is the age tier those results support. The tiers are Year 9 at age 14, Year 10 at age 15, Year 11 at age 16, Year 12 at age 17, and Year 13 at age 18. The peer line is Year 10, age 15. A weak note that simply holds stays left of that line. Meeting the Year 10 mathematics note sits on the line. An advanced note that holds sits above the line, toward Year 11, and is not called Year 12, Year 13, or NCEA. Passing a note that sat below Year 10 moves toward the line and does not cross it.
- Knowledge tech-tree. The student home map is `content/knowledge-tree.mjs` (seeded to `catalog/tree`). Domains fan into live and planned branches. A child unlocks when its parent field section is finished; planned nodes stay visible for interest only. Interest ticks still live at `interests/{uid}` and do not create modules.
- An expansion prompt. It names the finished section, the student id, the missed item ids, and the next strand id and difficulty for each field. Warwick copies that prompt into Cursor. The agent fetches `attempts/{uid}`, `repairs/{uid}`, and the guides for the missed ids, then writes one new module. The prompt is computed on the admin screen. It is not stored as its own database path, and it is not emailed. New modules stay shared once seeded.

A wrong choice does not open the web. It opens a two-paragraph in-app reading on the guide that buries the idea, then a different written question answerable from that reading alone.

### Module deepening

Early modules in a field cover primary essential knowledge only. As modules deepen, they broaden range as well as difficulty: more coverage and optional branches from the core already taught. When a module finishes, the expansion prompt requires the next cluster to deepen and broaden, list the core ideas already covered, and avoid only restating them. Explicit branch strands keep the same `field` and set `continues` to the finished strand. New branches should also be added to `content/knowledge-tree.mjs` so the student map stays ahead of unwritten content.

The next module follows the grade already on the screen.

| What the section showed | Next module |
| --- | --- |
| The note did not hold, or a weak note held | Same difficulty. A foundation module. Not a deeper dive |
| The answers passed a below-year note | Still age 15. One step further, toward the Year 10 line. Not a Year 11 module |
| The note held at the expected Year 10 place | More practice at this difficulty, or one step deeper if a deeper dive is requested |
| An advanced note held, or a later module held at its age tier | A deeper module at the next age tier |

The first module for each field is already written in `content/modules.mjs`, at the difficulty of the October notes. A second block for each category, plus electronics, economics, and finance, is in `content/modules-part2.mjs`. Those part 2 strands are the second sitting. They are not the reserved deeper ids in the table below. Mathematics and English sit at Year 10. Physics, biology, geology, history, politics, and technology sit at foundation level, with claims and evidence before the sciences. Chemistry continues from particles, ions, and pH. Psychology and social management are the deeper pass. A later module still uses a new strand id. If the id already has items, those items stay, and the next id is the one named in the latest module prompt. `placement-check` stays the survey. Its item ids, prompts, choices, answers, predicts, and orders stay.

Reserved homes for the first module after the survey:

| Field | Same-difficulty strand | Deeper strand |
| --- | --- | --- |
| Mathematics | `mathematics-hold` | `mathematics-depth-2` |
| English | `english-year10` | `english-depth-2` |
| Physics | `science-physics` | `physics-depth-2` |
| Chemistry | `science-chemistry` | `chemistry-depth-2` |
| Biology | `science-biology` | `biology-depth-2` |
| Geology | `science-earth` | `geology-depth-2` |
| History, politics, technology | `decision-context` | `decision-context-depth-2` |
| Psychology | `psychology-insight` | `psychology-insight` |
| Social management | `social-management` | `social-management-depth-2` |

History, politics, and technology stay one strand. They do not become three textbooks. `psychology-insight` in 2026 may name only the four distinctions in Father's texts. Management stays `management-101` and the Helios order, and it is generated only when the named topic is management.

A later module that holds moves that field's bar to the module's age tier and raises the depth. A later module that does not hold keeps the next module at the same difficulty. The wording is produced by `lib/expansion.mjs`. A future agent should follow that file rather than invent a second scoring rule.

The student sees the same depth chart on the finished placement result. She does not see the expansion prompt. The prompt is the parent's copy for the next Cursor session.

## Management walkthrough

She studies the tools in the order the essay uses them.

1. PESTEL letters, and what kind of fact each one takes.
2. Sort sentences from the Helios essay into those letters. Political and Legal stay distinct.
3. Build a SWOT from given facts. A strength is inside the firm. An opportunity is outside it.
4. Find the missing SMART part when the number or the date is removed.
5. Place one Helios action under Planning, Organising, Leading, or Controlling.
6. In the Leading section, separate a pay incentive from intrinsic motivation.
7. Research: an organisation she chooses. Her own PESTEL, SWOT, one SMART goal, and POLC, with those words doing the work.

Item ids for these steps are listed in `database.md` and stay stable.

## Database

`database.md` is the contract. The live rules already need to match it before any accounts or answers exist. Marking guides live under `guides`, which she cannot read. Her answers live under `attempts`. The parent's judgement lives under `reviews` and `mastery`, which she cannot overwrite.

Placement is written by the parent, from the table in this plan. She can change her display name. She cannot change the placement and she cannot grant herself the parent role.

## Still unknown

These do not change the 2026 course. They change how 2027 assessment is entered.

- Whether the section 38 exemption is already granted.
- The day she turns 16.
- Whether a link school has agreed to assess her, or Te Kura will be the route after 16.
- Any NZQA credits already on a Record of Achievement.

## Order of creation

1. This plan, the database contract, and rules that match the contract.
2. Her first login runs the placement check in `database.md`. The result validates or invalidates each note. A correction changes the placement field. It does not add a new tree. When the check is finished, the parent login shows the depth chart and the expansion prompt from Study modules. The next session names one field and adds one strand.
3. The rest of the app, after that check: two logins, the five bezels, and the management probes through to `m101-own-case`, saved as attempts and reviews.
4. The science claims probe, then physics, using the same screens.
5. English remains in the Start Right course. The site stores the essay or presentation she produces from it. It does not replace the rest of that book in the first build.
6. The mathematics hold check.
7. 2027 Level 1 choices, after Term 4 shows what is actually known.

No step is finished because a page rendered. It is finished when she can do that loop on the real material.

## Father's texts

Five manuscripts were read for this plan in October 2026. Each one is copyright Warwick Marshall, 2025. They are source records in `database.md`. The files themselves are not stored here, and a passage from one of them is not an item. Belief Mastery, Sovereign of Mind, Sovereign Integral Devotionalism, and the Distortion Codex reserve all rights. The Peer-Counseling Manual allows unaltered non-commercial sharing. That manual is still omitted, because its examples come from real sessions and the school does not assign the practice.

The screen stays the five bezels: question, answer, research, words, and a parent note. Long text stays collapsed. The parent note reviews the school answer. Management 101 stays the Helios order already fixed in this plan.

In 2026, `psychology-insight` may name four distinctions, and only these, once that strand is built:

- A projection is a guess about someone else. A fact is what was said or done.
- A need is what the situation is missing. A vice is a habit that tries to fill that need from outside.
- A public yes is a word said in the room. Commitment is the later action.
- A pay incentive is a reward attached to the job. Intrinsic motivation is wanting the activity itself.

The placement check already asks the third and fourth in its own items. The first two wait for `psychology-insight`. None of the four is a personal inventory, a counseling session, or a replacement for the October notes.

These texts wait. They are not student-readable items in 2026, and they are not seeded into `sources/` while a signed-in student can read that path.

- Sovereign of Mind, ISBN 9798291614921, 5 July 2025. The understandings that wait are sex-based manipulation, the dark tetrad, relationship repair applied to her own life, biological essentialism, sexual polarity, the subtle body, kinesiology, entities, possession, and the postscript. Chapter 5 avenue 6, chapter 7, chapters 8 to 10, the sex-based tactics in appendix 3, and appendix 1 section B stay in the book.
- Belief Mastery, ISBN 9798289867742, 3 July 2025. The book describes itself as belief surgery and says it is not clinical advice. Case studies come from real dialogues. Journey Home, The Return, reparenting, belief inference back to an earliest memory, dismantling, and catharsis stay out of schoolwork. Where trauma is in view, the book points to professional support. The school does not provide that support and does not imitate it.
- The Peer-Counseling Manual, ISBN 9798294770600, 30 July 2025, 42 pages. It is a group practice for circles of three to five, with timed roles, consent, eye contact, and discharge. One-to-one work is outside the manual's own scope. Themes include romantic and sexual relationships. School does not ask her to run this with family, friends, or classmates.
- Sovereign Integral Devotionalism, version 1.2. The file has no ISBN. The text says it is not a religion, and it reworks worship, prayer, baptism, and named sacred figures. It also uses Sophia as the name of a sacred pattern. The whole addendum stays off her screens.
- Distortion Codex, version 2.6. The ISBN field in the file is blank. Eighteen distortions are catalogued under historical demon names. The author calls them architectures. The diagnostic fields include possession signatures. The catalogue stays off her screens.

A later year can open one of these only by a change to this plan. That change names the understanding, the age, and the strand. It still does not paste the book into an item.

## Sources

- [NCEA levels and certificates](https://www2.nzqa.govt.nz/ncea/about-ncea/ncea-levels-and-certificates/)
- [NCEA co-requisite](https://ncea.education.govt.nz/overview-NCEA-corequisite-standards)
- [University Entrance literacy](https://www2.nzqa.govt.nz/ncea/understanding-secondary-quals/university-entrance/literacy-for-ue/)
- [NZQA rules for home-school assessment](https://www2.nzqa.govt.nz/about-us/rules-fees-policies/nzqa-rules/administrative-guidelines/internal-and-external-assessment-of-home-school-students/)
- [Education and Training Act 2020, section 38](https://www.legislation.govt.nz/act/public/2020/0038/latest/LMS176208.html)
- [Home education and qualifications](https://www.education.govt.nz/parents-and-caregivers/schools-year-0-13/home-education/qualifications-and-university-entry-home-educated-students)
