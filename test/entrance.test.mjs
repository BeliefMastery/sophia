import test from "node:test";
import assert from "node:assert/strict";
import { nodes } from "../content/knowledge-tree.mjs";
import {
  options,
  entranceCatalogRecord,
  effectiveEntrance,
  entranceRecordForSave,
  visibleEntranceNodeIds,
} from "../content/entrance-targets.mjs";
import { fieldClusterPrompt } from "../lib/expansion.mjs";

test("entrance catalog seeds with literacy and numeracy always on", () => {
  const catalog = entranceCatalogRecord(options);
  assert.equal(catalog.english.always, true);
  assert.equal(catalog.mathematics.always, true);
  assert.equal(catalog.psychology.defaultOn, true);
  assert.equal(catalog.management.defaultOn, true);
});

test("defaults apply when no entrance ticks are stored", () => {
  const ticks = effectiveEntrance({}, options);
  assert.equal(ticks.english, true);
  assert.equal(ticks.mathematics, true);
  assert.equal(ticks.science, true);
  assert.equal(ticks.psychology, true);
  assert.equal(ticks.management, true);
});

test("save record keeps always-on targets", () => {
  const saved = entranceRecordForSave({ science: true }, options);
  assert.equal(saved.english, true);
  assert.equal(saved.mathematics, true);
  assert.equal(saved.science, true);
  assert.equal(saved.psychology, undefined);
  assert.ok(saved.updatedAt);
});

test("entrance visibility includes foundations and excludes additional wings", () => {
  const ids = visibleEntranceNodeIds(
    { english: true, mathematics: true, psychology: true, updatedAt: 1 },
    options,
    nodes,
  );
  assert.ok(ids.has("english"));
  assert.ok(ids.has("mathematics"));
  assert.ok(ids.has("psychology"));
  assert.ok(ids.has("mind"));
  assert.equal(ids.has("philosophy"), false);
  assert.equal(ids.has("literature"), false);
  assert.equal(ids.has("applied"), false);
});

test("field cluster prompt names weak ideas and entrance scope", () => {
  const prompt = fieldClusterPrompt({
    name: "Sophia",
    uid: "student",
    field: {
      id: "physics",
      title: "Physics",
      complete: true,
      held: false,
      matched: 4,
      total: 6,
      need: 5,
      depth: 0,
      label: "Needs another module",
      nextStrandId: "physics-hold",
      missDetails: [
        {
          id: "p1",
          prompt: "What is force?",
          chosen: "Colour",
          repair: "A push or pull",
        },
      ],
    },
  });
  assert.match(prompt, /weak-spot brief/i);
  assert.match(prompt, /What is force\?/);
  assert.match(prompt, /University Entrance ramp/);
  assert.match(prompt, /out of scope/);
  assert.match(prompt, /same-level training set/i);
});
