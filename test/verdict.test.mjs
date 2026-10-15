import test from "node:test";
import assert from "node:assert/strict";
import { claims, judgeClaim } from "../lib/claims.mjs";

const claim = (id) => claims.find((entry) => entry.id === id);

test("a weak note is validated when the basic answers are missed", () => {
  const result = judgeClaim(claim("physics"), [
    { predict: "unknown", matched: false },
    { predict: "unknown", matched: false },
    { predict: "unknown", matched: false },
  ]);
  assert.equal(result.validated, true);
  assert.equal(result.direction, "validated");
  assert.match(result.text, /^Validated/);
});

test("one lucky hit does not overturn an extremely weak note", () => {
  const result = judgeClaim(claim("physics"), [
    { predict: "unknown", matched: true },
    { predict: "unknown", matched: false },
    { predict: "unknown", matched: false },
  ]);
  assert.equal(result.validated, true);
  assert.match(result.text, /1 of 3/);
});

test("two basic hits invalidate an extremely weak note as too low", () => {
  const result = judgeClaim(claim("physics"), [
    { predict: "unknown", matched: true },
    { predict: "unknown", matched: true },
    { predict: "unknown", matched: false },
  ]);
  assert.equal(result.validated, false);
  assert.equal(result.direction, "ahead");
  assert.match(result.text, /^Invalidated/);
});

test("a completed mathematics note fails when two answers miss", () => {
  const result = judgeClaim(claim("mathematics"), [
    { predict: "known", matched: true },
    { predict: "known", matched: false },
    { predict: "known", matched: false },
  ]);
  assert.equal(result.validated, false);
  assert.equal(result.direction, "behind");
});

test("a halfway English note holds only when both bands fit", () => {
  const held = judgeClaim(claim("english"), [
    { predict: "known", matched: true },
    { predict: "known", matched: true },
    { predict: "unknown", matched: false },
  ]);
  assert.equal(held.validated, true);

  const ahead = judgeClaim(claim("english"), [
    { predict: "known", matched: true },
    { predict: "known", matched: true },
    { predict: "unknown", matched: true },
  ]);
  assert.equal(ahead.validated, false);
  assert.equal(ahead.direction, "ahead");

  const behind = judgeClaim(claim("english"), [
    { predict: "known", matched: false },
    { predict: "known", matched: true },
    { predict: "unknown", matched: false },
  ]);
  assert.equal(behind.validated, false);
  assert.equal(behind.direction, "behind");

  const mixed = judgeClaim(claim("english"), [
    { predict: "known", matched: false },
    { predict: "known", matched: true },
    { predict: "unknown", matched: true },
  ]);
  assert.equal(mixed.direction, "mixed");
});

test("an advanced note is invalidated when two situations are missed", () => {
  const result = judgeClaim(claim("psychology"), [
    { predict: "known", matched: false },
    { predict: "known", matched: false },
    { predict: "known", matched: true },
  ]);
  assert.equal(result.validated, false);
  assert.equal(result.direction, "behind");
});
