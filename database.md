# Sophia database

This is the Realtime Database contract for project `sophia-138fe`. The live rules in `database.rules.json` match these paths. Study content and the app should use these paths as they are. Add fields when needed. Do not rename a path, and do not move marking guides into items Sophia can read.

The database URL is `https://sophia-138fe-default-rtdb.asia-southeast1.firebasedatabase.app`. It is not Firestore. No study records have been written yet. Accounts do not exist yet, so this file is the design, not a dump of live data.

## Who can touch what

A signed-in student reads her own profile, attempts, reviews, and mastery. She writes her name and her own attempts. She reads strands, items, and sources.

The parent does that, and also writes placement, strands, items, guides, sources, reviews, and mastery. Guides are marking notes. Sophia cannot read them.

`roles/{uid}/parent` is true only for the parent. Clients cannot write `roles`. That value is set later with the admin credential, after the login exists.

The root is closed. Someone who is not signed in cannot read or write.

## Paths

| Path | Holds | Student | Parent |
| --- | --- | --- | --- |
| `roles/{uid}/parent` | Whether this login is the parent | Read own | Read own, cannot write |
| `profiles/{uid}/name` | Display name | Read, write own | Read |
| `profiles/{uid}/placement` | What is known as of a date | Read own | Read, write |
| `strands/{strandId}` | A course strand | Read | Read, write |
| `items/{itemId}` | A probe, repair, research task, or retest | Read | Read, write |
| `guides/{itemId}` | What the parent looks for in an answer | No | Read, write |
| `sources/{sourceId}` | A text she is to understand | Read | Read, write |
| `attempts/{uid}/{attemptId}` | Her answer | Read and write own | Read |
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

`domain` is one of `english`, `mathematics`, `science`, `social`, `management`, `psychology`.

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
| `psychology-insight` | interest | Names for internal processes she already notices, tied to Leading |
| `decision-context` | foundation | History, politics, and technology only as far as a honest PESTEL needs them |

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

`kind` is `probe`, `repair`, `research`, or `retest`.

`answerKind` is `sentence`, `paragraph`, `essay`, or `presentation`. Essays and presentations are normal answers for her, not a special mode.

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

Her father's own books are further sources of this same shape. The repository does not contain those files yet. When a file is added, add a source record that says what understanding it is for. Do not paste a book into an item.

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

## What not to add

A second progress tree. A copy of the answers inside `items`. A public registration list. Firestore. A path per subject that does not fit `strands` and `items`.
