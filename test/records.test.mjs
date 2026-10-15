import test from "node:test";
import assert from "node:assert/strict";
import { strand, items } from "../content/placement-check.mjs";
import { claims, judgePlacement } from "../lib/claims.mjs";
import { checkRows, publicItem } from "../lib/records.mjs";

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

test("a later attempt does not replace the first answer", () => {
  const progress = checkRows(published, [
    { itemId: "check-math-1", selected: "two", matched: false, submittedAt: 1 },
    { itemId: "check-math-1", selected: "six", matched: true, submittedAt: 2 },
  ]);
  assert.equal(progress.next.id, "check-math-2");
});
