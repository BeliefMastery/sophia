import test from "node:test";
import assert from "node:assert/strict";
import { domains, catalogRecord, domainsFromCatalog } from "../content/interest-tree.mjs";
import { checkInterestTree } from "../lib/checkInterestTree.mjs";
import {
  avoidedFields,
  fieldClusterPrompt,
  interestVotePrompt,
  voteSummary,
} from "../lib/expansion.mjs";

test("the interest tree is valid and seeds as a catalog record", () => {
  assert.equal(checkInterestTree(domains).length, 0);
  const catalog = catalogRecord(domains);
  const listed = domainsFromCatalog(catalog);
  assert.ok(listed.length >= 4);
  assert.ok(listed.some((domain) => domain.subfields.some((sub) => sub.field === "electronics")));
});

test("avoided fields skip attempted, finished, and voted subfields", () => {
  const catalog = catalogRecord(domains);
  const fields = [
    { id: "physics", answered: 2, total: 2, complete: true, depth: 2 },
    { id: "mathematics", answered: 1, total: 4, complete: false, depth: 0 },
  ];
  const vote = { domainId: "science", subfieldId: "electronics", field: "electronics", submittedAt: 1 };
  const avoided = avoidedFields(catalog, fields, [], {}, [], vote);
  assert.equal(avoided.some((entry) => entry.field === "electronics"), false);
  assert.equal(avoided.some((entry) => entry.field === "physics"), false);
  assert.equal(avoided.some((entry) => entry.field === "mathematics"), false);
  assert.ok(avoided.some((entry) => entry.field === "biology"));
});

test("vote summary and prompts name the vote and avoided list", () => {
  const catalog = catalogRecord(domains);
  const vote = voteSummary({
    domainId: "science",
    subfieldId: "electronics",
    field: "electronics",
    submittedAt: 10,
  }, catalog);
  assert.equal(vote.title, "Electronics");
  const avoided = [{ domainId: "english", domainTitle: "English", subfieldId: "english", title: "English", field: "english" }];
  const interest = interestVotePrompt({ name: "Student", uid: "abc", vote, avoided });
  assert.match(interest, /Interest vote: Science \/ Electronics/);
  assert.match(interest, /Fields avoided: English \/ English/);
  const cluster = fieldClusterPrompt({
    name: "Student",
    uid: "abc",
    field: {
      id: "physics",
      title: "Physics",
      complete: true,
      depth: 2,
      label: "Year 10",
      nextStrandId: "physics-cluster-2",
    },
    vote,
    avoided,
  });
  assert.match(cluster, /Field complete: physics/);
  assert.match(cluster, /Interest vote:/);
  assert.match(cluster, /Fields avoided:/);
});
