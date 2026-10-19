import test from "node:test";
import assert from "node:assert/strict";
import { claims, judgeClaim } from "../lib/claims.mjs";
import {
  ageTiers,
  applyModules,
  expansionPrompt,
  fieldMarks,
  fieldClusterPrompt,
  fieldPlace,
  fieldProgress,
  fieldStudy,
  moduleOutcome,
  moduleScopeIssues,
  modulesToProduce,
  moduleLabel,
  nextFieldStep,
  modulePrompt,
  peerAt,
  sectionStatus,
  toRoman,
} from "../lib/expansion.mjs";
import { strands as coreStrands, items as coreItems } from "../content/modules.mjs";
import { strands as part2Strands, items as part2Items } from "../content/modules-part2.mjs";
import { strands as heliosStrands, items as heliosItems } from "../content/modules-helios.mjs";
import { strands as uniStrands, items as uniItems } from "../content/modules-university.mjs";
import { checkModules } from "../lib/checkModules.mjs";

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
  const items = [1, 2, 3, 4, 5, 6].map((order) => ({
    id: `physics-mod-${order}`,
    strandId: "science-physics",
    claim: "physics",
    order,
    prompt: `Physics question ${order}`,
    choices: { a: { text: "Choice A" }, b: { text: "Choice B" } },
  }));
  const attempts = items.map((item, index) => ({
    itemId: item.id,
    matched: index < 5,
    selected: index < 5 ? "a" : "b",
    submittedAt: index + 1,
  }));
  const repairs = { "physics-mod-6": { answer: "A newton is a force." } };
  const outcome = moduleOutcome(strand, items, attempts, repairs);
  assert.equal(outcome.complete, true);
  assert.equal(outcome.held, true);
  assert.equal(outcome.matched, 5);
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
  assert.match(prompt, /Physics question 6/);
  assert.match(prompt, /does not award NCEA/);
  assert.equal(modulePrompt({ name: "Sample", uid: "uid-1", outcome: { ...outcome, complete: false } }), "");
});

test("a later module that misses stays at the same difficulty", () => {
  const items = [1, 2, 3, 4, 5, 6].map((order) => ({
    id: `physics-mod-${order}`,
    strandId: "science-physics",
    order,
    prompt: `Physics question ${order}`,
    choices: { a: { text: "A" }, b: { text: "B" } },
  }));
  const outcome = moduleOutcome({
    id: "science-physics",
    field: "physics",
    depth: 2,
    ageTier: "year10",
    title: "Physics foundation",
  }, items, [
    { itemId: "physics-mod-1", matched: false, selected: "b", submittedAt: 1 },
    { itemId: "physics-mod-2", matched: false, selected: "b", submittedAt: 2 },
    { itemId: "physics-mod-3", matched: true, selected: "a", submittedAt: 3 },
    { itemId: "physics-mod-4", matched: true, selected: "a", submittedAt: 4 },
    { itemId: "physics-mod-5", matched: true, selected: "a", submittedAt: 5 },
    { itemId: "physics-mod-6", matched: true, selected: "a", submittedAt: 6 },
  ], {
    "physics-mod-1": { answer: "one" },
    "physics-mod-2": { answer: "two" },
  });
  assert.equal(outcome.complete, true);
  assert.equal(outcome.held, false);
  assert.equal(outcome.matched, 4);
  assert.equal(outcome.mode, "same");
  assert.equal(outcome.label, "Short of Year 10");
  assert.ok(outcome.position < peerAt);
  assert.equal(outcome.nextStrandId, "science-physics-practice");
  assert.match(modulePrompt({ name: "Sample", uid: "uid-1", outcome }), /same field covering the missed/);
  assert.match(modulePrompt({ name: "Sample", uid: "uid-1", outcome }), /Physics question 1/);
});

test("question counts stay with each field across every block", () => {
  const strands = {
    "placement-check": { order: 0 },
    "mathematics-hold": { order: 2, field: "mathematics" },
    "decision-context": { order: 9 },
    electronics: { order: 14, field: "electronics" },
  };
  const items = [
    { id: "check-math-1", strandId: "placement-check", claim: "mathematics", order: 1 },
    { id: "check-eng-1", strandId: "placement-check", claim: "english", order: 2 },
    { id: "check-hist-1", strandId: "placement-check", claim: "history", order: 3 },
    { id: "math-1", strandId: "mathematics-hold", claim: "mathematics", order: 1 },
    { id: "ctx-hist-1", strandId: "decision-context", claim: "history", order: 1 },
    { id: "ctx-pol-1", strandId: "decision-context", claim: "politics", order: 2 },
    { id: "elec-1", strandId: "electronics", claim: "electronics", order: 1 },
  ];
  const attempts = [{ itemId: "check-math-1", submittedAt: 1, matched: true }];
  const fields = fieldProgress(strands, items, attempts);
  const math = fields.find((field) => field.id === "mathematics");
  const history = fields.find((field) => field.id === "history");
  const politics = fields.find((field) => field.id === "politics");
  const electronics = fields.find((field) => field.id === "electronics");
  assert.equal(math.answered, 1);
  assert.equal(math.total, 2);
  assert.equal(history.total, 2);
  assert.equal(politics.total, 1);
  assert.equal(electronics.title, "Electronics");
  assert.equal(electronics.answered, 0);
  assert.equal(electronics.total, 1);
  assert.equal(fields.some((field) => field.total === items.length), false);
  const place = fieldPlace(strands, items, items[3]);
  assert.equal(place.title, "Mathematics");
  assert.equal(place.index, 2);
  assert.equal(place.total, 2);
});

test("a finished field asks for the next cluster and leaves other fields open", () => {
  const strands = {
    "placement-check": { order: 0 },
    "mathematics-hold": { order: 2, field: "mathematics", depth: 2, ageTier: "year10", title: "Mathematics hold, part 1" },
    electronics: { order: 14, field: "electronics", depth: 2, ageTier: "year10", title: "Electronics, part 1" },
  };
  const items = [
    { id: "check-math-1", strandId: "placement-check", claim: "mathematics", order: 1 },
    { id: "math-1", strandId: "mathematics-hold", claim: "mathematics", order: 1 },
    { id: "elec-1", strandId: "electronics", claim: "electronics", order: 1 },
  ];
  const attempts = [
    { itemId: "check-math-1", matched: true, submittedAt: 1 },
    { itemId: "math-1", matched: false, submittedAt: 2 },
  ];
  const open = fieldStudy(strands, items, attempts, {});
  const openMath = open.find((field) => field.id === "mathematics");
  assert.equal(openMath.complete, false);
  assert.equal(openMath.repairsDue, 1);
  assert.equal(fieldClusterPrompt({ name: "Sophia", uid: "uid-1", field: openMath }), "");
  assert.equal(nextFieldStep(strands, items, attempts, {}, "mathematics").kind, "repair");
  assert.equal(nextFieldStep(strands, items, attempts, {}, "electronics").item.id, "elec-1");

  const repairs = { "math-1": { answer: "I checked the working." } };
  const doneAttempts = [...attempts, { itemId: "elec-1", matched: true, submittedAt: 3 }];
  const done = fieldStudy(strands, items, doneAttempts, repairs);
  const math = done.find((field) => field.id === "mathematics");
  const electronics = done.find((field) => field.id === "electronics");
  assert.equal(math.complete, true);
  assert.equal(math.held, false);
  assert.equal(math.awaitingModule, true);
  assert.equal(math.moduleRoman, "Module I");
  assert.equal(math.nextModuleRoman, "Module II");
  assert.equal(electronics.complete, true);
  assert.equal(electronics.held, true);
  assert.equal(electronics.awaitingModule, true);
  assert.equal(nextFieldStep(strands, items, doneAttempts, repairs, "mathematics").kind, "done");
  const prompt = fieldClusterPrompt({ name: "Sophia", uid: "uid-1", field: math });
  assert.match(prompt, /Field complete: mathematics/);
  assert.match(prompt, /did not hold/i);
  assert.match(prompt, /same-level training set/);
  assert.match(prompt, /weak-spot brief/);
  assert.match(prompt, /does not award NCEA/);
  assert.doesNotMatch(prompt, /electronics/);
  const queue = modulesToProduce([
    { uid: "uid-1", name: "Sophia", fields: [math, electronics] },
  ]);
  assert.equal(queue.length, 2);
  assert.ok(queue.some((row) => row.fieldId === "mathematics" && row.mode === "same"));
  assert.ok(queue.some((row) => row.fieldId === "electronics" && row.mode === "deeper"));
  const mathRow = queue.find((row) => row.fieldId === "mathematics");
  assert.ok((mathRow.weakIdeas || []).length >= 0);
});

test("roman numerals label modules", () => {
  assert.equal(toRoman(1), "I");
  assert.equal(toRoman(2), "II");
  assert.equal(toRoman(4), "IV");
  assert.equal(moduleLabel(3), "Module III");
  assert.equal(moduleLabel(0), "");
});

test("domain modules stay in the six-question hold scope", () => {
  const strands = [...coreStrands, ...part2Strands, ...heliosStrands, ...uniStrands];
  const items = [...coreItems, ...part2Items, ...heliosItems, ...uniItems];
  assert.deepEqual(moduleScopeIssues(strands, items), []);
  assert.deepEqual(checkModules(strands, items, []), []);
});

test("Helios research item is a written step after the six choice probes", () => {
  const strands = Object.fromEntries(heliosStrands.map((strand) => [strand.id, strand]));
  const step = nextFieldStep(strands, heliosItems, [], {}, "management");
  assert.equal(step.kind, "question");
  assert.equal(step.item.id, "m101-pestel-letters");
  const answered = heliosItems
    .filter((item) => item.answerKind === "choice")
    .map((item, index) => ({ itemId: item.id, matched: true, submittedAt: index + 1 }));
  const research = nextFieldStep(strands, heliosItems, answered, {}, "management");
  assert.equal(research.kind, "written");
  assert.equal(research.item.id, "m101-own-case");
});
