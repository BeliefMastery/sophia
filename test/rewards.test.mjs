import test from "node:test";
import assert from "node:assert/strict";
import { claims, judgeClaim } from "../lib/claims.mjs";
import { rewardFor } from "../lib/rewards.mjs";

const claim = (id) => claims.find((entry) => entry.id === id);

function judged(id, rows) {
  return judgeClaim(claim(id), rows);
}

test("a weak note that simply holds is not a reward", () => {
  const reward = rewardFor(judged("physics", [
    { predict: "unknown", matched: false },
    { predict: "unknown", matched: false },
    { predict: "unknown", matched: false },
  ]));
  assert.equal(reward, null);
});

test("passing a below-year note is an achievement and says it is not above Year 10", () => {
  const reward = rewardFor(judged("physics", [
    { predict: "unknown", matched: true },
    { predict: "unknown", matched: true },
    { predict: "unknown", matched: false },
  ]));
  assert.equal(reward.level, "achievement");
  assert.equal(reward.title, "Achievement");
  assert.match(reward.detail, /below the usual Year 10 line for age 15/);
  assert.match(reward.detail, /do not show the subject is above Year 10/);
});

test("Year 10 mathematics that holds is an achievement at the age line", () => {
  const reward = rewardFor(judged("mathematics", [
    { predict: "known", matched: true },
    { predict: "known", matched: true },
    { predict: "known", matched: true },
  ]));
  assert.equal(reward.level, "achievement");
  assert.match(reward.detail, /Year 10 level expected at age 15/);
  assert.match(reward.detail, /does not go past that line/);
});

test("a missed mathematics note is not a reward", () => {
  const reward = rewardFor(judged("mathematics", [
    { predict: "known", matched: false },
    { predict: "known", matched: false },
    { predict: "known", matched: true },
  ]));
  assert.equal(reward, null);
});

test("an advanced note that holds is an excellent achievement above Year 10", () => {
  for (const id of ["psychology", "socialManagement"]) {
    const reward = rewardFor(judged(id, [
      { predict: "known", matched: true },
      { predict: "known", matched: true },
      { predict: "known", matched: true },
    ]));
    assert.equal(reward.level, "excellent", id);
    assert.equal(reward.title, "Excellent achievement");
    assert.match(reward.detail, /above the usual Year 10 level for age 15/);
  }
});

test("an advanced note that slips is not a reward", () => {
  const reward = rewardFor(judged("psychology", [
    { predict: "known", matched: false },
    { predict: "known", matched: false },
    { predict: "known", matched: true },
  ]));
  assert.equal(reward, null);
});

test("English past the halfway note stays inside Year 10", () => {
  const reward = rewardFor(judged("english", [
    { predict: "known", matched: true },
    { predict: "known", matched: true },
    { predict: "unknown", matched: true },
  ]));
  assert.equal(reward.level, "achievement");
  assert.match(reward.detail, /ahead of the note/);
  assert.match(reward.detail, /not above the usual Year 10 level for age 15/);
});

test("an open note has no reward", () => {
  assert.equal(rewardFor({ claimId: "physics", open: true, direction: "ahead", validated: false }), null);
});
