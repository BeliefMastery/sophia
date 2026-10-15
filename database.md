# Sophia database

This is the Realtime Database contract for project `sophia-138fe`. The live rules in `database.rules.json` match these paths. Study content and the app should use these paths as they are. Add fields when needed. Do not rename a path, and do not move marking guides into items Sophia can read.

The database URL is `https://sophia-138fe-default-rtdb.asia-southeast1.firebasedatabase.app`. It is not Firestore. No study records have been written yet. Accounts do not exist yet, so this file is the design, not a dump of live data.

## Who can touch what

A signed-in student reads her own profile, attempts, reviews, and mastery. She writes her name and her own attempts. She reads strands, items, and sources. After a wrong multiple-choice answer is stored, she can read that one guide.

The parent does that, and also writes placement, strands, items, guides, sources, reviews, and mastery. The parent login is the admin report: it can read every profile and every attempt. Guides are marking notes. Sophia cannot read a guide before she has missed that question, and she cannot read the guide list.

`roles/{uid}/parent` is true only for the parent. Clients cannot write `roles`. That value is set later with the admin credential, after the login exists.

The root is closed. Someone who is not signed in cannot read or write.

## Paths

| Path | Holds | Student | Parent |
| --- | --- | --- | --- |
| `roles/{uid}/parent` | Whether this login is the parent | Read own | Read own, cannot write |
| `profiles/{uid}/name` | Display name | Read, write own | Read |
| `profiles/{uid}/placement` | What is known as of a date | Read own | Read, write |
| `strands/{strandId}` | A course strand | Read | Read, write |
| `items/{itemId}` | A probe, repair, research task, retest, or placement check | Read | Read, write |
| `guides/{itemId}` | What the parent looks for in an answer, including the choice id and the explanation | Read one guide after a miss on that item | Read, write |
| `misses/{uid}/{itemId}` | The wrong choice that opens that guide. Create once. The rules accept it only when the choice is actually wrong | Create own | No |
| `sources/{sourceId}` | A text she is to understand | Read | Read, write |
| `attempts/{uid}/{attemptId}` | Her answer. She can create one. She cannot edit or delete it | Read, create own | Read all |
| `reviews/{uid}/{attemptId}` | Known, partial, or unknown, plus a note | Read own | Read, write |
| `mastery/{uid}/{strandId}/{ideaId}` | Whether an idea is currently known | Read own | Read, write |

`attemptId` is a Realtime Database push id. Do not use the item id as the attempt id. She will answer the same idea more than once, and the earlier answer has to remain.

## Placement

Placement is the parent's record of where she is. It is not a score she sets. The first placement, once the parent login exists, is the record below. Update a field when a later review shows it has changed. Do not invent a second profile tree.

```json
{
  "asOf": "2026-10-15",
  "age": 15,
  "english": "year10-start-right-halfway",
  "mathematics": "year10-start-right-project-book-complete",
  "science": {
    "geology": "very-poor",
    "chemistry": "ph-and-basic-ions",
    "biology": "very-poor",
    "physics": "extremely-poor"
  },
  "social": {
    "history": "poor",
    "politics": "poor",
    "technology": "poor",
    "psychology": "advanced",
    "socialManagement": "advanced"
  },
  "interests": ["management", "psychology"],
  "outputs": ["basic-essays", "presentations"]
}
```

## Strand record

```json
{
  "title": "Management 101",
  "domain": "management",
  "phase": "interest",
  "order": 10,
  "summary": "PESTEL, SWOT, SMART, and POLC, first on the Helios essay, then on a case of her own."
}
```

`domain` is one of `english`, `mathematics`, `science`, `social`, `management`, `psychology`, `placement`. `placement` is only the first-login check.

`phase` is one of `foundation`, `year10`, `ncea-l1`, `interest`.

Stable strand ids:

| Id | Phase | Job |
| --- | --- | --- |
| `english-year10` | year10 | Finish the Year 10 Start Right English course she is halfway through |
| `mathematics-hold` | year10 | Check that the completed mathematics book still holds. New mathematics waits on that |
| `science-claims` | foundation | Tell a claim from an opinion, and say what would count as a check |
| `science-physics` | foundation | Force, motion, and energy. This is the widest science gap |
| `science-chemistry` | foundation | Continue from particles, ions, and pH |
| `science-biology` | foundation | Cells, then systems |
| `science-earth` | foundation | Rocks, change, and deep time, after claims and basic chemistry |
| `management-101` | interest | The Helios walkthrough, then her own case |
| `psychology-insight` | interest | Names for internal processes she already notices, tied to Leading. In 2026 the allowed names are in Father's texts in `plan.md` |
| `decision-context` | foundation | History, politics, and technology only as far as a honest PESTEL needs them |
| `placement-check` | foundation | First login. Multiple choice that validates or invalidates the October 2026 placement notes. The self-reviews inside Sovereign of Mind are a different battery |

## Item record

Items contain everything she is allowed to see. They do not contain the answer.

```json
{
  "strandId": "management-101",
  "ideaId": "pestel-letters",
  "kind": "probe",
  "order": 1,
  "answerKind": "paragraph",
  "prompt": "Name the six PESTEL forces and say, in one sentence each, what kind of fact belongs to that letter.",
  "words": {
    "macro": {
      "term": "macro-environment",
      "plain": "The world outside one firm: laws, prices, customers, tools, and the land.",
      "example": "A tax credit is part of the macro-environment. A tired sales team is not."
    }
  }
}
```

`kind` is `probe`, `repair`, `research`, `retest`, or `check`. `check` is only the first-login placement check.

`answerKind` is `sentence`, `paragraph`, `essay`, `presentation`, or `choice`. Essays and presentations are normal answers for her, not a special mode. A `choice` item adds `claim`, `predict`, and `choices`. `predict` is `known` or `unknown`: what the October 2026 note expects. It is not the answer. The screen does not announce it before she answers. The correct choice id lives on the guide, under `answer`, not on the item.

```json
{
  "strandId": "placement-check",
  "ideaId": "placement-physics",
  "kind": "check",
  "order": 7,
  "answerKind": "choice",
  "claim": "physics",
  "predict": "unknown",
  "prompt": "Which unit measures energy?",
  "choices": {
    "newton": { "text": "newton", "order": 1 },
    "joule": { "text": "joule", "order": 2 }
  }
}
```

`ideaId` groups a probe, its repair or research, and its retest. Mastery is stored on `ideaId`, not on the item.

## Guide record

The guide key matches the item id. Sophia's login cannot read this path.

```json
{
  "lookFor": [
    "Six letters, each with the right kind of fact",
    "Political and Legal are not collapsed into one vague 'government'"
  ],
  "misconceptions": [
    "Calling a strength or a weakness a PESTEL force"
  ],
  "sourceIds": {
    "helios-strategic-execution": true
  }
}
```

## Source record

```json
{
  "title": "Strategic execution essay: Helios Energy",
  "by": "Walkthrough text supplied for Sophia",
  "whyItMatters": "She wants to see PESTEL become SWOT, then a SMART goal, then POLC.",
  "file": "sources/helios-strategic-execution.md"
}
```

Her father's books use this same shape. `file` is empty because the manuscripts are not in the repository. `whyItMatters` names the understanding a later probe may cite. These five records are the contract. They stay in this file in 2026 and are not written to `sources/`, because a signed-in student can read that path. The hold list lives in `plan.md`. An item never contains a passage from a book.

```json
{
  "title": "Sovereign of Mind",
  "by": "Warwick Marshall",
  "whyItMatters": "A projection is a guess about someone else. A fact is what was said or done. The 2026 use is that distinction, inside psychology-insight, when that strand is built.",
  "file": ""
}
```

```json
{
  "title": "Belief Mastery",
  "by": "Warwick Marshall",
  "whyItMatters": "A need is what the situation is missing. A vice is a habit that tries to fill that need from outside. The 2026 use is that distinction only.",
  "file": ""
}
```

```json
{
  "title": "The Peer-Counseling Manual",
  "by": "Warwick Marshall",
  "whyItMatters": "A listener can leave the speaker in charge of the problem. The school loop already does that with a probe and a research brief. The group practice itself is not a school activity.",
  "file": ""
}
```

```json
{
  "title": "Sovereign Integral Devotionalism",
  "by": "Warwick Marshall",
  "whyItMatters": "Held. No 2026 probe cites it. The addendum is a devotional text, and it uses Sophia as the name of a sacred pattern.",
  "file": ""
}
```

```json
{
  "title": "Distortion Codex",
  "by": "Warwick Marshall",
  "whyItMatters": "Held. No 2026 probe cites it. The catalogue names distortions with historical demon names and includes possession signatures.",
  "file": ""
}
```

Stable source ids, if a later year writes a record: `sovereign-of-mind`, `belief-mastery`, `peer-counseling`, `sovereign-integral-devotionalism`, `distortion-codex`. Do not rename them. Do not point `file` at a manuscript.

## Attempt and review

```json
{
  "itemId": "m101-pestel-letters",
  "strandId": "management-101",
  "ideaId": "pestel-letters",
  "answerKind": "paragraph",
  "answer": "Her words.",
  "submittedAt": 1763200000000
}
```

A placement-check attempt stores the chosen id and whether it matched the guide. She sends `matched`. The rules accept the write only when `matched` is the real comparison with `guides/{itemId}/answer`. A wrong `matched` is rejected, so the client cannot invent a correct answer.

A miss uses the item id, not a push id. The rules accept it only when `matched` is false and that is also the real comparison. After that write, she can read `guides/{itemId}`. The guide holds the choice id, `lookFor`, and `misconceptions`. The screen shows the choice text and those lines. A correct answer does not open the guide.

```json
{
  "selected": "newton",
  "matched": false,
  "submittedAt": 1763200000000
}
```

```json
{
  "itemId": "check-physics-2",
  "strandId": "placement-check",
  "ideaId": "placement-physics",
  "answerKind": "choice",
  "selected": "joule",
  "matched": true,
  "submittedAt": 1763200000000
}
```

The first attempt for an item is the one that counts. A later push id does not replace it. Single-level notes validate when a majority of the three answers fit `predict`. English and chemistry contain both `known` and `unknown` questions, and those notes validate only when every answer fits. The wording for each note is in `lib/claims.mjs`. The questions and the key are in `content/placement-check.mjs`. The React app does not import that file.

```json
{
  "itemId": "m101-pestel-letters",
  "result": "partial",
  "note": "Legal was folded into Political.",
  "redo": true
}
```

`result` is `known`, `partial`, or `unknown`. The parent writes it. A known result is what allows mastery to be set. Opening a panel is not mastery.

## Mastery

```json
{
  "state": "known",
  "evidenceAttemptId": "-Nexample",
  "updatedAt": 1763200000000
}
```

`state` is `unknown`, `partial`, or `known`. The next item in a strand can name `requiresIdea`. The client shows it when that idea is `known`, or when the parent clears it. The database does not try to hide unread items from her, because she is the only student. It does hide guides.

## Management items to write first

These ids stay. The prompts can be edited. The ids should not, or attempts will point at nothing.

| Item id | Kind | Idea |
| --- | --- | --- |
| `m101-pestel-letters` | probe | What each PESTEL letter asks for |
| `m101-helios-sort` | probe | Sort sentences from the Helios essay into the six letters |
| `m101-swot-from-facts` | probe | Build a SWOT from given facts. Strengths are not opportunities |
| `m101-smart-missing` | probe | Say which SMART part is missing when the number or the date is gone |
| `m101-polc-place` | probe | Place one Helios action under Planning, Organising, Leading, or Controlling, and say why |
| `m101-leading-motive` | probe | Tell a pay incentive from intrinsic motivation, using the Leading section |
| `m101-own-case` | research | A real organisation she chooses. Her own PESTEL, SWOT, one SMART goal, and POLC. The words have to be doing work |

`m101-own-case` is the research task. It opens after the probes show the gaps, not before. A retest id, when a probe fails, is the probe id plus `-retest`. Example: `m101-pestel-letters-retest`. Same `ideaId`, new question.

## Placement-check items

These ids stay. Three questions for each October 2026 note. `predict` follows that note: `known` where the note says the idea is already there, `unknown` where it says the idea is not.

| Item ids | Claim | Note | Predict |
| --- | --- | --- | --- |
| `check-math-1` `check-math-2` `check-math-3` | `mathematics` | Year 10 project book complete | all `known` |
| `check-english-1` `check-english-2` `check-english-3` | `english` | Halfway through Year 10 | two `known`, then one `unknown` |
| `check-physics-1` `check-physics-2` `check-physics-3` | `physics` | Extremely poor | all `unknown` |
| `check-chem-1` `check-chem-2` `check-chem-3` | `chemistry` | pH and basic ions only | two `known`, then one `unknown` |
| `check-bio-1` `check-bio-2` `check-bio-3` | `biology` | Very poor | all `unknown` |
| `check-geo-1` `check-geo-2` `check-geo-3` | `geology` | Very poor | all `unknown` |
| `check-history-1` `check-history-2` `check-history-3` | `history` | Poor | all `unknown` |
| `check-politics-1` `check-politics-2` `check-politics-3` | `politics` | Poor | all `unknown` |
| `check-tech-1` `check-tech-2` `check-tech-3` | `technology` | Poor | all `unknown` |
| `check-psych-1` `check-psych-2` `check-psych-3` | `psychology` | Advanced | all `known` |
| `check-social-1` `check-social-2` `check-social-3` | `socialManagement` | Advanced | all `known` |

Management is an interest, not a claimed level, so the check does not score it.

## What not to add

A second progress tree. A copy of the answers inside `items`. A public registration list. Firestore. A path per subject that does not fit `strands` and `items`.
