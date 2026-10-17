import test from "node:test";
import assert from "node:assert/strict";
import { markRepair, reviewRecord } from "../lib/markRepair.mjs";

test("an accepted answer marks known", () => {
  const mark = markRepair("The number was 7.", {
    repairAccept: ["7", "seven"],
    lookFor: ["unused long phrase"],
  });
  assert.equal(mark.result, "known");
  assert.equal(mark.source, "auto");
  assert.match(mark.note, /accepted/i);
});

test("a short accept does not match inside a longer number", () => {
  const mark = markRepair("I got 15.", {
    repairAccept: ["5"],
  });
  assert.equal(mark.result, "unknown");
});

test("all lookFor phrases mark known", () => {
  const mark = markRepair("Rise over run and the vertical change is clear.", {
    lookFor: ["rise over run", "vertical change"],
  });
  assert.equal(mark.result, "known");
  assert.match(mark.note, /all 2/);
});

test("one lookFor phrase marks partial", () => {
  const mark = markRepair("I used rise over run.", {
    lookFor: ["rise over run", "vertical change is 6"],
  });
  assert.equal(mark.result, "partial");
  assert.match(mark.note, /1 of 2/);
});

test("no lookFor hit marks unknown", () => {
  const mark = markRepair("I guessed.", {
    lookFor: ["rise over run", "vertical change"],
  });
  assert.equal(mark.result, "unknown");
});

test("empty mark keys mark partial", () => {
  const mark = markRepair("Anything thoughtful here.", {});
  assert.equal(mark.result, "partial");
  assert.equal(mark.note, "Saved; no auto-mark key yet");
});

test("reviewRecord stores the auto mark shape", () => {
  const mark = markRepair("7", { repairAccept: ["7"] });
  const record = reviewRecord("math-hold-1", mark, 123);
  assert.deepEqual(record, {
    itemId: "math-hold-1",
    result: "known",
    note: mark.note,
    source: "auto",
    submittedAt: 123,
  });
});
