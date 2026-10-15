import test from "node:test";
import assert from "node:assert/strict";
import { recordChoice } from "../lib/recordChoice.mjs";

function denied() {
  const error = new Error("permission");
  error.code = "PERMISSION_DENIED";
  return error;
}

test("a matching choice is stored as matched", async () => {
  const writes = [];
  const matched = await recordChoice(async (body) => {
    if (body.matched !== true) throw denied();
    writes.push(body);
  }, { selected: "joule" });
  assert.equal(matched, true);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].matched, true);
});

test("a miss is stored only after the rules reject a false match", async () => {
  const writes = [];
  const matched = await recordChoice(async (body) => {
    if (body.matched !== false) throw denied();
    writes.push(body);
  }, { selected: "newton" });
  assert.equal(matched, false);
  assert.deepEqual(writes.map((body) => body.matched), [false]);
});

test("a network failure is not recorded as a miss", async () => {
  await assert.rejects(
    recordChoice(async () => {
      const error = new Error("offline");
      error.code = "NETWORK";
      throw error;
    }, { selected: "joule" }),
    /offline/,
  );
});
