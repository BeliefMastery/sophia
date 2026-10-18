import test from "node:test";
import assert from "node:assert/strict";
import { strand, items } from "../content/placement-check.mjs";
import { claims, judgePlacement } from "../lib/claims.mjs";
import { checkRows, openRepair, orderedChoices, publicItem } from "../lib/records.mjs";

const published = items.map((item) => ({ id: item.id, ...publicItem(item) }));

test("the check resumes at the first unanswered question", () => {
  const progress = checkRows(published, [{
    itemId: "check-math-1",
    selected: "six",
    matched: true,
    submittedAt: 1,
  }]);
  assert.equal(progress.complete, false);
  assert.equal(progress.next.id, "check-math-2");
  assert.equal(strand.domain, "placement");
});

test("answers that follow every note validate the whole placement", () => {
  const attempts = items.map((item) => ({
    itemId: item.id,
    selected: item.predict === "known"
      ? item.answer
      : item.choices.find((choice) => choice.id !== item.answer).id,
    matched: item.predict === "known",
    submittedAt: item.order,
  }));
  const progress = checkRows(published, attempts);
  assert.equal(progress.complete, true);
  const verdicts = judgePlacement(claims, progress.byClaim);
  assert.equal(verdicts.every((verdict) => verdict.validated), true);
  assert.equal(verdicts.length, 11);
});

test("a miss blocks the next question until the written answer is saved", () => {
  const missed = [{ itemId: "check-math-1", selected: "two", matched: false, submittedAt: 1 }];
  const blocked = openRepair(published, missed, {});
  assert.equal(blocked.item.id, "check-math-1");
  assert.equal(blocked.selected, "two");
  const blank = openRepair(published, missed, { "check-math-1": { answer: "   ", submittedAt: 2 } });
  assert.equal(blank.item.id, "check-math-1");
  const repaired = openRepair(published, missed, { "check-math-1": { answer: "y = 5", submittedAt: 2 } });
  assert.equal(repaired, null);
  assert.equal(openRepair(published, [], {}), null);
  const correctFirst = openRepair(published, [
    { itemId: "check-math-1", selected: "six", matched: true, submittedAt: 1 },
  ], {});
  assert.equal(correctFirst, null);
});

test("a later attempt does not replace the first answer", () => {
  const progress = checkRows(published, [
    { itemId: "check-math-1", selected: "two", matched: false, submittedAt: 1 },
    { itemId: "check-math-1", selected: "six", matched: true, submittedAt: 2 },
  ]);
  assert.equal(progress.next.id, "check-math-2");
});

test("choice display order is stable but shuffled by item id", () => {
  const sample = items[0];
  const first = orderedChoices(sample.choices, sample.id).map((choice) => choice.id);
  const again = orderedChoices(sample.choices, sample.id).map((choice) => choice.id);
  assert.deepEqual(first, again);
  const plain = orderedChoices(sample.choices).map((choice) => choice.id);
  assert.equal(first.length, 4);
  assert.equal(new Set(first).size, 4);
  assert.notDeepEqual(first, plain);
});
