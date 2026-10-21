import test from "node:test";
import assert from "node:assert/strict";
import { nodes } from "../content/knowledge-tree.mjs";
import { lateralFieldFor, lateralStrandId } from "../lib/lateral.mjs";
import { fieldStudy } from "../lib/expansion.mjs";

test("lateral prefers an empty child leaf over a filled preferred neighbour", () => {
  const items = [
    { id: "f1", strandId: "finance", claim: "finance" },
  ];
  const strands = { finance: { field: "finance" } };
  assert.equal(lateralFieldFor("mathematics", { items, strands, treeNodes: nodes }), "statistics");
});

test("lateral strand ids name parent and leaf", () => {
  assert.equal(lateralStrandId("physics", "engineering"), "physics-to-engineering");
});

test("a held field queues deepen and lateral next modules", () => {
  const strands = {
    "mathematics-hold": {
      id: "mathematics-hold",
      field: "mathematics",
      depth: 2,
      ageTier: "year10",
      title: "Mathematics hold",
      order: 1,
    },
  };
  const items = [
    {
      id: "m1",
      strandId: "mathematics-hold",
      claim: "mathematics",
      order: 1,
      answerKind: "choice",
      choices: { a: { text: "a" }, b: { text: "b" }, c: { text: "c" }, d: { text: "d" } },
    },
    {
      id: "m2",
      strandId: "mathematics-hold",
      claim: "mathematics",
      order: 2,
      answerKind: "choice",
      choices: { a: { text: "a" }, b: { text: "b" }, c: { text: "c" }, d: { text: "d" } },
    },
    {
      id: "m3",
      strandId: "mathematics-hold",
      claim: "mathematics",
      order: 3,
      answerKind: "choice",
      choices: { a: { text: "a" }, b: { text: "b" }, c: { text: "c" }, d: { text: "d" } },
    },
    {
      id: "m4",
      strandId: "mathematics-hold",
      claim: "mathematics",
      order: 4,
      answerKind: "choice",
      choices: { a: { text: "a" }, b: { text: "b" }, c: { text: "c" }, d: { text: "d" } },
    },
    {
      id: "m5",
      strandId: "mathematics-hold",
      claim: "mathematics",
      order: 5,
      answerKind: "choice",
      choices: { a: { text: "a" }, b: { text: "b" }, c: { text: "c" }, d: { text: "d" } },
    },
    {
      id: "m6",
      strandId: "mathematics-hold",
      claim: "mathematics",
      order: 6,
      answerKind: "choice",
      choices: { a: { text: "a" }, b: { text: "b" }, c: { text: "c" }, d: { text: "d" } },
    },
  ];
  const attempts = items.map((item, index) => ({
    itemId: item.id,
    matched: true,
    submittedAt: index + 1,
  }));
  const [math] = fieldStudy(strands, items, attempts, {}).filter((field) => field.id === "mathematics");
  assert.equal(math.complete, true);
  assert.equal(math.held, true);
  assert.ok(math.nextModules.some((entry) => entry.mode === "deeper" && entry.awaiting));
  assert.ok(math.nextModules.some((entry) => entry.mode === "lateral" && entry.fieldId === "finance"));
  assert.equal(math.awaitingModule, true);
});
