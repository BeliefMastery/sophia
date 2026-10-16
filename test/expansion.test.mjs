import test from "node:test";
import assert from "node:assert/strict";
import { claims, judgeClaim } from "../lib/claims.mjs";
import {
  ageTiers,
  applyModules,
  expansionPrompt,
  fieldMarks,
  moduleOutcome,
  modulePrompt,
  peerAt,
  sectionStatus,
} from "../lib/expansion.mjs";

const claim = (id) => claims.find((entry) => entry.id === id);

function judged(id, rows) {
  return judgeClaim(claim(id), rows);
}

function surveyItem(id, claimId, order, predict) {
  return {
    id,
    claim: claimId,
    order,
    predict,
    strandId: "placement-check",
    prompt: id,
    choices: {},
  };
}

function attempt(itemId, matched, submittedAt) {
  return { itemId, matched, submittedAt, selected: "a", strandId: "placement-check" };
}

test("age tiers run from Year 9 at 14 to Year 13 at 18, with peers at Year 10", () => {
  assert.deepEqual(ageTiers.map((tier) => [tier.label, tier.age]), [
    ["Year 9", 14],
    ["Year 10", 15],
    ["Year 11", 16],
    ["Year 12", 17],
    ["Year 13", 18],
  ]);
  assert.equal(peerAt, 25);
  assert.equal(ageTiers.find((tier) => tier.id === "year10").at, peerAt);
});

test("a weak note that holds is depth 1 below the peer line and stays at foundation difficulty", () => {
  const verdict = judged("physics", [
    { predict: "unknown", matched: false },
    { predict: "unknown", matched: false },
    { predict: "unknown", matched: false },
  ]);
  const items = [1, 2, 3].map((order) => surveyItem(`check-physics-${order}`, "physics", order, "unknown"));
  const attempts = items.map((item, index) => attempt(item.id, false, index + 1));
  const repairs = Object.fromEntries(items.map((item) => [item.id, { answer: "A force changes motion." }]));
  const [mark] = fieldMarks([verdict], items, attempts, repairs);
  assert.equal(mark.depth, 1);
  assert.equal(mark.position, 8);
  assert.ok(mark.position < peerAt);
  assert.equal(mark.label, "Below the Year 10 line");
  assert.equal(mark.mode, "same");
  assert.equal(mark.nextStrandId, "science-physics");
  assert.match(mark.recommendation, /same foundation difficulty/);
  assert.match(mark.recommendation, /Do not write a deeper dive/);
});

test("Year 10 mathematics that holds sits on the peer line", () => {
  const verdict = judged("mathematics", [
    { predict: "known", matched: true },
    { predict: "known", matched: true },
    { predict: "known", matched: true },
  ]);
  const items = [1, 2, 3].map((order) => surveyItem(`check-math-${order}`, "mathematics", order, "known"));
  const attempts = items.map((item, index) => attempt(item.id, true, index + 1));
  const [mark] = fieldMarks([verdict], items, attempts, {});
  assert.equal(mark.position, peerAt);
  assert.equal(mark.label, "Year 10");
  assert.equal(mark.mode, "either");
  assert.equal(mark.nextStrandId, "mathematics-hold");
});

test("passing a below-year note moves toward Year 10 and does not open a Year 11 dive", () => {
  const verdict = judged("physics", [
    { predict: "unknown", matched: true },
    { predict: "unknown", matched: true },
    { predict: "unknown", matched: false },
  ]);
  const items = [1, 2, 3].map((order) => surveyItem(`check-physics-${order}`, "physics", order, "unknown"));
  const attempts = [
    attempt("check-physics-1", true, 1),
    attempt("check-physics-2", true, 2),
    attempt("check-physics-3", false, 3),
  ];
  const repairs = { "check-physics-3": { answer: "Energy is measured in joules." } };
  const [mark] = fieldMarks([verdict], items, attempts, repairs);
  assert.equal(mark.position, 16);
  assert.ok(mark.position < peerAt);
  assert.equal(mark.label, "Toward the Year 10 line");
  assert.equal(mark.mode, "same");
  assert.match(mark.recommendation, /do not show the subject is above Year 10/);
  assert.match(mark.recommendation, /age 15/);
  assert.equal(mark.nextStrandId, "science-physics");
});

test("an advanced note that holds is above the peer line and asks for a deeper module", () => {
  for (const [id, strandId] of [["psychology", "psychology-insight"], ["socialManagement", "social-management-depth-2"]]) {
    const verdict = judged(id, [
      { predict: "known", matched: true },
      { predict: "known", matched: true },
      { predict: "known", matched: true },
    ]);
    const items = [1, 2, 3].map((order) => surveyItem(`${id}-${order}`, id, order, "known"));
    const attempts = items.map((item, index) => attempt(item.id, true, index + 1));
    const [mark] = fieldMarks([verdict], items, attempts, {});
    assert.equal(mark.mode, "deeper", id);
    assert.equal(mark.label, "Above Year 10");
    assert.ok(mark.position > peerAt && mark.position < 50, id);
    assert.equal(mark.nextStrandId, strandId, id);
    assert.match(mark.recommendation, /Year 11, age 16|deeper dive above Year 10/);
    assert.match(mark.recommendation, /NCEA/);
  }
});

test("a missed mathematics note stays below the peer line at the same difficulty", () => {
  const verdict = judged("mathematics", [
    { predict: "known", matched: false },
    { predict: "known", matched: false },
    { predict: "known", matched: true },
  ]);
  const items = [1, 2, 3].map((order) => surveyItem(`check-math-${order}`, "mathematics", order, "known"));
  const attempts = [
    attempt("check-math-1", false, 1),
    attempt("check-math-2", false, 2),
    attempt("check-math-3", true, 3),
  ];
  const repairs = {
    "check-math-1": { answer: "I divided both sides." },
    "check-math-2": { answer: "The square was 100." },
  };
  const [mark] = fieldMarks([verdict], items, attempts, repairs);
  assert.equal(mark.position, 14);
  assert.ok(mark.position < peerAt);
  assert.equal(mark.mode, "same");
  assert.equal(mark.nextStrandId, "mathematics-hold");
});

test("English that holds the halfway note stays inside Year 10", () => {
  const verdict = judged("english", [
    { predict: "known", matched: true },
    { predict: "known", matched: true },
    { predict: "unknown", matched: false },
  ]);
  const items = [1, 2, 3].map((order) => surveyItem(`check-english-${order}`, "english", order, order === 3 ? "unknown" : "known"));
  const attempts = [
    attempt("check-english-1", true, 1),
    attempt("check-english-2", true, 2),
    attempt("check-english-3", false, 3),
  ];
  const repairs = { "check-english-3": { answer: "The repeated word is the bus." } };
  const [mark] = fieldMarks([verdict], items, attempts, repairs);
  assert.equal(mark.label, "Halfway through Year 10");
  assert.equal(mark.position, 16);
  assert.ok(mark.position < peerAt);
  assert.equal(mark.mode, "either");
  assert.equal(mark.nextStrandId, "english-year10");
  assert.match(mark.recommendation, /not above Year 10/);
});

test("a field with a miss and no written repair has no depth yet", () => {
  const verdict = judged("physics", [
    { predict: "unknown", matched: false },
    { predict: "unknown", matched: false },
    { predict: "unknown", matched: false },
  ]);
  const items = [1, 2, 3].map((order) => surveyItem(`check-physics-${order}`, "physics", order, "unknown"));
  const attempts = items.map((item, index) => attempt(item.id, false, index + 1));
  const [mark] = fieldMarks([verdict], items, attempts, {});
  assert.equal(mark.depth, 0);
  assert.equal(mark.position, null);
  assert.equal(mark.label, "Written answer still due");
});

test("the expansion prompt appears only when the section and its repairs are finished", () => {
  const items = [1, 2, 3].map((order) => surveyItem(`check-math-${order}`, "mathematics", order, "known"));
  const attempts = items.map((item, index) => attempt(item.id, true, index + 1));
  const open = sectionStatus(items, attempts.slice(0, 2), {});
  assert.equal(open.complete, false);
  assert.equal(expansionPrompt({ name: "Sample", uid: "uid-1", status: open, marks: [] }), "");

  const missed = [
    attempt("check-math-1", false, 1),
    attempt("check-math-2", true, 2),
    attempt("check-math-3", true, 3),
  ];
  const due = sectionStatus(items, missed, {});
  assert.equal(due.complete, false);
  assert.equal(due.repairsDue, 1);
  assert.deepEqual(due.missed, ["check-math-1"]);

  const done = sectionStatus(items, attempts, {});
  assert.equal(done.complete, true);
  const verdict = judged("mathematics", [
    { predict: "known", matched: true },
    { predict: "known", matched: true },
    { predict: "known", matched: true },
  ]);
  const marks = fieldMarks([verdict], items, attempts, {});
  const prompt = expansionPrompt({ name: "Sample", uid: "uid-1", status: done, marks });
  assert.match(prompt, /Section complete: placement-check, Placement check, depth 1 survey/);
  assert.match(prompt, /Student uid: uid-1/);
  assert.match(prompt, /attempts\/uid-1/);
  assert.match(prompt, /repairs\/uid-1/);
  assert.match(prompt, /Do not rename placement-check/);
  assert.match(prompt, /does not award NCEA/);
  assert.match(prompt, /Missed item ids: none/);
  assert.match(prompt, /mathematics-hold/);
  assert.match(prompt, /Father's texts/);
  assert.match(prompt, /decision-context/);
  assert.doesNotMatch(prompt, /joule|x = 6|lookFor|@/);
});

test("a later module that holds raises the field depth without renaming the strand", () => {
  const strand = {
    id: "science-physics",
    title: "Physics foundation",
    field: "physics",
    depth: 2,
    ageTier: "year10",
  };
  const items = [1, 2, 3].map((order) => ({
    id: `physics-mod-${order}`,
    strandId: "science-physics",
    claim: "physics",
    order,
  }));
  const attempts = items.map((item, index) => ({
    itemId: item.id,
    matched: index < 2,
    submittedAt: index + 1,
  }));
  const repairs = { "physics-mod-3": { answer: "A newton is a force." } };
  const outcome = moduleOutcome(strand, items, attempts, repairs);
  assert.equal(outcome.complete, true);
  assert.equal(outcome.depth, 2);
  assert.equal(outcome.position, peerAt);
  assert.equal(outcome.mode, "deeper");
  assert.equal(outcome.nextStrandId, "science-physics-depth-3");
  assert.match(outcome.recommendation, /Do not rename science-physics/);

  const survey = fieldMarks([
    judged("physics", [
      { predict: "unknown", matched: false },
      { predict: "unknown", matched: false },
      { predict: "unknown", matched: false },
    ]),
  ], [1, 2, 3].map((order) => surveyItem(`check-physics-${order}`, "physics", order, "unknown")), [
    attempt("check-physics-1", false, 1),
    attempt("check-physics-2", false, 2),
    attempt("check-physics-3", false, 3),
  ], {
    "check-physics-1": { answer: "one" },
    "check-physics-2": { answer: "two" },
    "check-physics-3": { answer: "three" },
  });
  const [raised] = applyModules(survey, [outcome]);
  assert.equal(raised.depth, 2);
  assert.equal(raised.position, peerAt);
  assert.equal(survey[0].depth, 1);

  const prompt = modulePrompt({ name: "Sample", uid: "uid-1", outcome });
  assert.match(prompt, /science-physics-depth-3/);
  assert.match(prompt, /does not award NCEA/);
  assert.equal(modulePrompt({ name: "Sample", uid: "uid-1", outcome: { ...outcome, complete: false } }), "");
});

test("a later module that misses stays at the same difficulty", () => {
  const outcome = moduleOutcome({
    id: "science-physics",
    field: "physics",
    depth: 2,
    ageTier: "year10",
    title: "Physics foundation",
  }, [1, 2, 3].map((order) => ({ id: `physics-mod-${order}`, strandId: "science-physics", order })), [
    { itemId: "physics-mod-1", matched: false, submittedAt: 1 },
    { itemId: "physics-mod-2", matched: false, submittedAt: 2 },
    { itemId: "physics-mod-3", matched: true, submittedAt: 3 },
  ], {
    "physics-mod-1": { answer: "one" },
    "physics-mod-2": { answer: "two" },
  });
  assert.equal(outcome.mode, "same");
  assert.equal(outcome.label, "Short of Year 10");
  assert.ok(outcome.position < peerAt);
  assert.equal(outcome.nextStrandId, "science-physics-practice");
});
