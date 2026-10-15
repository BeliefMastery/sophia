# Sophia plan

This is the research and creation plan named in `sophiaplam.md`. That file stays the scope. This file says who the study is for, in what order ideas are taught, and when building the site is allowed to start. The database contract is `database.md`. Paths in that file are the ones to build against.

Sophia is 15. In October 2026 she is still in Year 10 work, not in an NCEA year. Mathematics: the Year 10 Start Right project book is complete. English: she is halfway through the Year 10 Start Right course. Her homeschool work already includes basic essays and presentations. General science is well behind. Psychology and social management are ahead of the rest. She wants to understand Management 101, and she wants to walk through the Helios Energy essay in `sources/helios-strategic-execution.md`.

The site is the place that study happens. It is a React app with two logins and the Firebase Realtime Database already created for `sophia-138fe`. A session starts with a question. Long text stays collapsed. The screen is bezels: question, answer, research, words, and a parent note.

## What this plan is protecting

The course order and the database paths are fixed here so the app is not rebuilt around a different learner or a different tree. Question wording can change. A path name, a strand id, or a management item id should not.

Her father's books are part of what she should eventually understand. Those files are not in the repository yet. When they are added, each one becomes a source record as described in `database.md`. They are not a reason to open a new curriculum structure.

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
| Psychology | Advanced | A strength. Give the ideas names and tests. Do not assume the vocabulary is already precise |
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
4. The people strand inside management. When the item is about Leading, use her psychology and social management strength. Ask her to distinguish a pay incentive from intrinsic motivation before treating the idea as known.

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

The first screen after login is the next probe.

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
2. The parent checks the placement table. A correction changes a field. It does not add a new tree.
3. The app, only after that: two logins, the five bezels, and the management probes through to `m101-own-case`, saved as attempts and reviews.
4. The science claims probe, then physics, using the same screens.
5. English remains in the Start Right course. The site stores the essay or presentation she produces from it. It does not replace the rest of that book in the first build.
6. The mathematics hold check.
7. 2027 Level 1 choices, after Term 4 shows what is actually known.

No step is finished because a page rendered. It is finished when she can do that loop on the real material.

## Sources

- [NCEA levels and certificates](https://www2.nzqa.govt.nz/ncea/about-ncea/ncea-levels-and-certificates/)
- [NCEA co-requisite](https://ncea.education.govt.nz/overview-NCEA-corequisite-standards)
- [University Entrance literacy](https://www2.nzqa.govt.nz/ncea/understanding-secondary-quals/university-entrance/literacy-for-ue/)
- [NZQA rules for home-school assessment](https://www2.nzqa.govt.nz/about-us/rules-fees-policies/nzqa-rules/administrative-guidelines/internal-and-external-assessment-of-home-school-students/)
- [Education and Training Act 2020, section 38](https://www.legislation.govt.nz/act/public/2020/0038/latest/LMS176208.html)
- [Home education and qualifications](https://www.education.govt.nz/parents-and-caregivers/schools-year-0-13/home-education/qualifications-and-university-entry-home-educated-students)
