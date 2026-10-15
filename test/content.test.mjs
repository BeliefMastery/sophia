import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { strand, items } from "../content/placement-check.mjs";
import { checkContent } from "../lib/checkContent.mjs";
import { publicItem } from "../lib/records.mjs";

test("placement check covers every October note without leaking the key", () => {
  const errors = checkContent(strand, items);
  assert.deepEqual(errors, []);
});

test("the public item record has choices and no answer", () => {
  const published = publicItem(items[0]);
  assert.equal(published.answerKind, "choice");
  assert.equal(published.answer, undefined);
  assert.equal(Object.keys(published.choices).length, 4);
});

test("the React source does not import the answer key", () => {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
  const files = readdirSync(root);
  for (const file of files) {
    const source = readFileSync(path.join(root, file), "utf8");
    assert.equal(source.includes("content/placement-check"), false, file);
    assert.equal(source.includes("lookFor"), false, file);
  }
});
