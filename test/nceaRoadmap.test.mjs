import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

test("NceaRoadmap source includes the 4 NZQA University Entrance pillars and standards", () => {
  const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "NceaRoadmap.jsx");
  const source = readFileSync(file, "utf8");

  // Verified NZQA Co-requisite standards
  assert.ok(source.includes("US32403"), "Includes Reading Literacy CAA US32403");
  assert.ok(source.includes("US32405"), "Includes Writing Literacy CAA US32405");
  assert.ok(source.includes("US32406"), "Includes Numeracy CAA US32406");

  // UE Literacy requirements (Level 2+)
  assert.ok(source.includes("5 Reading + 5 Writing"), "Includes UE Literacy 5 reading + 5 writing rule");

  // Approved Subjects Level 3 requirement
  assert.ok(source.includes("14+ Credits each at Level 3"), "Includes 14+ credits at Level 3 requirement");

  // Four-Year Timeline (2026 to 2029)
  assert.ok(source.includes("Term 4, 2026"), "Includes Year 10 Foundation late 2026");
  assert.ok(source.includes("2027"), "Includes Year 11 2027");
  assert.ok(source.includes("2028"), "Includes Year 12 2028");
  assert.ok(source.includes("2029"), "Includes Year 13 UE 2029");

  // Learning frontiers diagnostics
  assert.ok(source.includes("Where You Are Limited"), "Includes diagnostic frontier heading");
  assert.ok(source.includes("Physics Mechanics"), "Identifies physics as a current limitation to bridge");
  assert.ok(source.includes("Chemistry: Particles, Ions & pH"), "Identifies chemistry as a limitation to bridge");
});
