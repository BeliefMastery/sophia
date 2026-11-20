import test from "node:test";
import assert from "node:assert/strict";
import { checkChoices, auditChoices } from "../lib/checkChoices.mjs";

test("repeated Only… openings on wrong answers are rejected", () => {
  const errors = checkChoices({
    id: "sample-only",
    answerKind: "choice",
    answer: "need",
    choices: [
      { id: "need", text: "The user need and the design limits" },
      { id: "a", text: "Only the profit the shop wants" },
      { id: "b", text: "Only a law already passed" },
      { id: "c", text: "Only how the designer feels" },
    ],
  });
  assert.ok(errors.some((line) => line.includes("Only…")));
});

test("parallel numeric choices are allowed", () => {
  assert.deepEqual(checkChoices({
    id: "sample-num",
    answerKind: "choice",
    answer: "six",
    choices: [
      { id: "two", text: "x = 2" },
      { id: "six", text: "x = 6" },
      { id: "four", text: "x = 4" },
      { id: "ten", text: "x = 10" },
    ],
  }), []);
});

test("auditChoices catches absolute qualifiers and negative framing on distractors", () => {
  const warnings = auditChoices({
    id: "sample-tells",
    answerKind: "choice",
    answer: "balanced",
    choices: [
      { id: "balanced", text: "It depends on the context and evidence" },
      { id: "a", text: "It always works in every situation" },
      { id: "b", text: "It never applies and cannot be used" },
      { id: "c", text: "It ignores all evidence" },
    ],
  });
  assert.ok(warnings.some((line) => line.includes("absolute qualifiers")));
  assert.ok(warnings.some((line) => line.includes("negative framing")));
});
