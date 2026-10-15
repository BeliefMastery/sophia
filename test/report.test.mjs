import test from "node:test";
import assert from "node:assert/strict";
import { items } from "../content/placement-check.mjs";
import { explainMiss } from "../lib/explain.mjs";
import { guideRecord, publicItem } from "../lib/records.mjs";
import { studentReport } from "../lib/report.mjs";

test("a miss explanation names the choice text and the look-for line", () => {
  const item = publicItem(items[0]);
  const guide = guideRecord(items[0]);
  const explained = explainMiss({ ...item, choices: item.choices }, guide);
  assert.equal(explained.answerText, "x = 6");
  assert.match(explained.explanation[0], /x − 2 = 4/);
  assert.equal(explained.slips.length > 0, true);
});

test("the report scores the first answer and keeps later activity", () => {
  const math = items.filter((item) => item.claim === "mathematics").map((item) => ({ id: item.id, ...publicItem(item) }));
  const guides = Object.fromEntries(items.filter((item) => item.claim === "mathematics").map((item) => [item.id, guideRecord(item)]));
  const report = studentReport(math, [
    { id: "later", itemId: "check-math-1", selected: "six", matched: true, submittedAt: 20 },
    { id: "first", itemId: "check-math-1", selected: "two", matched: false, submittedAt: 10 },
    { id: "second", itemId: "check-math-2", selected: "ten", matched: true, submittedAt: 30 },
  ], guides, {
    "check-math-1": { answer: "y = 5. After dividing, y + 1 = 6.", submittedAt: 15 },
  });

  assert.equal(report.answered, 2);
  assert.equal(report.correct, 1);
  assert.equal(report.incorrect, 1);
  assert.equal(report.questions[0].chosen, "x = 2");
  assert.equal(report.questions[0].answerText, "x = 6");
  assert.equal(report.questions[0].repair, "y = 5. After dividing, y + 1 = 6.");
  assert.equal(report.activity.find((row) => row.id === "first").repair, "y = 5. After dividing, y + 1 = 6.");
  assert.equal(report.verdicts[0].open, true);
  assert.equal(report.verdicts[0].answered, 2);
  assert.equal(report.activity[0].id, "second");
  assert.equal(report.activity.find((row) => row.id === "later").counted, false);
  assert.equal(report.activity.find((row) => row.id === "first").counted, true);
});
