import test from "node:test";
import assert from "node:assert/strict";
import { nodes, interestOptionsFromTree, treeCatalogRecord, nodesFromCatalog } from "../content/knowledge-tree.mjs";
import { checkKnowledgeTree } from "../lib/checkKnowledgeTree.mjs";
import { evaluateTree } from "../lib/knowledgeTree.mjs";
import { checkInterestTree } from "../lib/checkInterestTree.mjs";

test("the knowledge tree is valid and seeds cleanly", () => {
  assert.equal(checkKnowledgeTree(nodes).length, 0);
  const catalog = treeCatalogRecord(nodes);
  assert.ok(nodesFromCatalog(catalog).some((node) => node.id === "electronics"));
  assert.ok(nodesFromCatalog(catalog).some((node) => node.id === "nzHistory" && node.status === "planned"));
});

test("interest options derive from the tree", () => {
  const options = interestOptionsFromTree(nodes);
  assert.equal(checkInterestTree(options).length, 0);
  assert.ok(options.some((option) => option.id === "philosophy"));
  assert.ok(options.some((option) => option.id === "electronics"));
  assert.equal(options.some((option) => option.id === "science"), false);
});

test("planned nodes are never studyable", () => {
  const fields = [
    { id: "physics", answered: 6, total: 6, complete: true, depth: 2, label: "Done" },
  ];
  const evaluated = evaluateTree(nodes, fields);
  const planned = evaluated.filter((node) => node.status === "planned");
  assert.ok(planned.length > 0);
  assert.equal(planned.every((node) => node.studyable === false && node.state === "planned"), true);
  const nz = evaluated.find((node) => node.id === "nzHistory");
  assert.equal(nz.studyable, false);
  assert.equal(nz.state, "planned");
  const science = evaluated.find((node) => node.id === "science");
  assert.equal(science.studyable, false);
  assert.equal(science.state, "open");
});

test("electronics stays locked until physics is complete", () => {
  const locked = evaluateTree(nodes, [
    { id: "physics", answered: 2, total: 6, complete: false, depth: 0, label: "In progress" },
    { id: "electronics", answered: 0, total: 6, complete: false, depth: 0, label: "Not started" },
  ]);
  assert.equal(locked.find((node) => node.id === "electronics").state, "locked");
  assert.equal(locked.find((node) => node.id === "electronics").studyable, false);

  const open = evaluateTree(nodes, [
    { id: "physics", answered: 6, total: 6, complete: true, depth: 2, label: "Done" },
    { id: "electronics", answered: 0, total: 6, complete: false, depth: 0, label: "Not started" },
  ]);
  assert.equal(open.find((node) => node.id === "electronics").state, "open");
  assert.equal(open.find((node) => node.id === "electronics").studyable, true);
});

test("science children stay open without cross-domain locks", () => {
  const evaluated = evaluateTree(nodes, [
    { id: "physics", answered: 0, total: 6, complete: false, depth: 0, label: "Not started" },
    { id: "chemistry", answered: 0, total: 6, complete: false, depth: 0, label: "Not started" },
    { id: "mathematics", answered: 0, total: 6, complete: false, depth: 0, label: "Not started" },
  ]);
  assert.equal(evaluated.find((node) => node.id === "physics").state, "open");
  assert.equal(evaluated.find((node) => node.id === "chemistry").state, "open");
  assert.equal(evaluated.find((node) => node.id === "mathematics").state, "open");
});

test("active and complete states follow field progress", () => {
  const evaluated = evaluateTree(nodes, [
    { id: "english", answered: 3, total: 6, complete: false, depth: 0, label: "In progress" },
    { id: "history", answered: 6, total: 6, complete: true, depth: 2, label: "Done" },
  ]);
  assert.equal(evaluated.find((node) => node.id === "english").state, "active");
  assert.equal(evaluated.find((node) => node.id === "history").state, "complete");
});
