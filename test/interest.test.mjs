import test from "node:test";
import assert from "node:assert/strict";
import { options, interestsCatalogRecord, optionsFromCatalog, tickedInterests } from "../content/interest-tree.mjs";
import { checkInterestTree } from "../lib/checkInterestTree.mjs";
import { fieldClusterPrompt, modulePrompt } from "../lib/expansion.mjs";
import { buildPassage, checkPassage } from "../lib/passage.mjs";

test("interest options are valid and include planned university-style fields", () => {
  assert.equal(checkInterestTree(options).length, 0);
  const catalog = interestsCatalogRecord(options);
  const listed = optionsFromCatalog(catalog);
  assert.ok(listed.some((option) => option.id === "philosophy"));
  assert.ok(listed.some((option) => option.id === "design"));
});

test("ticked interests list only true catalog options", () => {
  const catalog = interestsCatalogRecord(options);
  const ticks = tickedInterests({ philosophy: true, design: true, updatedAt: 1, missing: true }, catalog);
  assert.deepEqual(ticks.map((row) => row.id).sort(), ["design", "philosophy"]);
});

test("passages are two long paragraphs without the correct choice text", () => {
  const item = {
    id: "sample",
    claim: "physics",
    answer: "newton",
    choices: [
      { id: "newton", text: "a unique correct phrase xyz" },
      { id: "other", text: "something else" },
    ],
    lookFor: ["Force changes the motion of a mass when it is unbalanced."],
    misconceptions: ["Thinking a push is needed to keep constant speed."],
    discover: [{ label: "Search: unbalanced force and changing motion" }],
  };
  const passage = buildPassage(item);
  assert.equal(passage.length, 2);
  assert.equal(checkPassage({ ...item, passage }).length, 0);
  assert.equal(passage.join(" ").toLowerCase().includes("a unique correct phrase xyz"), false);
});

test("expansion prompts require passages and core-then-branch deepening", () => {
  const cluster = fieldClusterPrompt({
    name: "Student",
    uid: "abc",
    field: {
      id: "history",
      title: "History",
      complete: true,
      depth: 2,
      label: "Year 10",
      nextStrandId: "history-cluster-2",
    },
  });
  assert.match(cluster, /two passage paragraphs/);
  assert.match(cluster, /deepen and broaden/);
  assert.match(cluster, /Interest checkboxes are a register only/);
  const module = modulePrompt({
    name: "Student",
    uid: "abc",
    outcome: {
      complete: true,
      strandId: "science-earth",
      title: "Earth",
      depth: 2,
      field: "geology",
      missed: [],
      recommendation: "Write the next module one step deeper.",
    },
  });
  assert.match(module, /deepen and broaden/);
  assert.match(module, /two-paragraph/);
});
