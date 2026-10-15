import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { ref, set, get, update } from "firebase/database";
import { items } from "../content/placement-check.mjs";
import { publicItem, guideRecord } from "../lib/records.mjs";

const physics = items.find((item) => item.id === "check-physics-2");
const paragraph = {
  id: "m101-pestel-letters",
  strandId: "management-101",
  ideaId: "pestel-letters",
  kind: "probe",
  order: 1,
  answerKind: "paragraph",
  prompt: "Name the six PESTEL forces.",
};

let testEnv;

test.before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-sophia",
    database: {
      rules: readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "database.rules.json"), "utf8"),
    },
  });
});

test.after(async () => {
  if (testEnv) await testEnv.cleanup();
});

test.beforeEach(async () => {
  await testEnv.clearDatabase();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.database();
    await set(ref(db, `items/${physics.id}`), publicItem(physics));
    await set(ref(db, `guides/${physics.id}`), guideRecord(physics));
    await set(ref(db, `items/${paragraph.id}`), {
      strandId: paragraph.strandId,
      ideaId: paragraph.ideaId,
      kind: paragraph.kind,
      order: paragraph.order,
      answerKind: paragraph.answerKind,
      prompt: paragraph.prompt,
    });
  });
});

function choiceAttempt(selected, matched) {
  return {
    itemId: physics.id,
    strandId: physics.strandId,
    ideaId: physics.ideaId,
    answerKind: "choice",
    selected,
    matched,
    submittedAt: Date.now(),
  };
}

test("the rules accept the real match and reject a forged one", async () => {
  const student = testEnv.authenticatedContext("student").database();
  const attempt = ref(student, "attempts/student/one");
  await assertSucceeds(set(attempt, choiceAttempt(physics.answer, true)));
  await assertFails(set(ref(student, "attempts/student/two"), choiceAttempt("newton", true)));
  await assertSucceeds(set(ref(student, "attempts/student/two"), choiceAttempt("newton", false)));
  await assertFails(set(ref(student, "attempts/student/three"), choiceAttempt(physics.answer, false)));
});

test("an attempt cannot be edited or deleted", async () => {
  const student = testEnv.authenticatedContext("student").database();
  const attempt = ref(student, "attempts/student/one");
  await assertSucceeds(set(attempt, choiceAttempt("newton", false)));
  await assertFails(update(attempt, { matched: true }));
  await assertFails(set(attempt, null));
});

test("a student cannot read the guide or write placement", async () => {
  const student = testEnv.authenticatedContext("student").database();
  await assertFails(get(ref(student, `guides/${physics.id}`)));
  await assertSucceeds(get(ref(student, `items/${physics.id}`)));
  await assertFails(set(ref(student, "profiles/student/placement"), { physics: "advanced" }));
  const stranger = testEnv.unauthenticatedContext().database();
  await assertFails(get(ref(stranger, `items/${physics.id}`)));
});

test("a wrong choice opens that guide and a correct choice does not", async () => {
  const student = testEnv.authenticatedContext("student").database();
  await assertFails(set(ref(student, `misses/student/${physics.id}`), {
    selected: physics.answer,
    matched: false,
    submittedAt: Date.now(),
  }));
  await assertFails(get(ref(student, `guides/${physics.id}`)));
  await assertSucceeds(set(ref(student, `misses/student/${physics.id}`), {
    selected: "newton",
    matched: false,
    submittedAt: Date.now(),
  }));
  const guide = await get(ref(student, `guides/${physics.id}`));
  assert.equal(guide.val().answer, physics.answer);
  assert.equal(guide.val().lookFor[0].length > 0, true);
  await assertFails(get(ref(student, "guides")));
});

test("a parent can list attempts and profiles", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.database();
    await set(ref(db, "roles/parent/parent"), true);
    await set(ref(db, "profiles/student/name"), "Sophia");
    await set(ref(db, "attempts/student/one"), choiceAttempt("newton", false));
  });
  const parent = testEnv.authenticatedContext("parent").database();
  const attempts = await get(ref(parent, "attempts"));
  assert.equal(attempts.val().student.one.selected, "newton");
  const profiles = await get(ref(parent, "profiles"));
  assert.equal(profiles.val().student.name, "Sophia");
  const student = testEnv.authenticatedContext("student").database();
  await assertFails(get(ref(student, "attempts")));
  await assertFails(get(ref(student, "profiles")));
});

test("a paragraph attempt still saves without a choice key", async () => {
  const student = testEnv.authenticatedContext("student").database();
  await assertSucceeds(set(ref(student, "attempts/student/essay"), {
    itemId: paragraph.id,
    strandId: paragraph.strandId,
    ideaId: paragraph.ideaId,
    answerKind: "paragraph",
    answer: "Political, Economic, Social, Technological, Environmental, Legal.",
    submittedAt: Date.now(),
  }));
});

test("a written repair is allowed only after a real miss", async () => {
  const student = testEnv.authenticatedContext("student").database();
  const repair = {
    answer: "The unit is the one used for energy.",
    submittedAt: Date.now(),
  };
  await assertFails(set(ref(student, `repairs/student/${physics.id}`), repair));
  await assertFails(set(ref(student, `repairs/student/${physics.id}`), { answer: "   ", submittedAt: Date.now() }));
  await assertSucceeds(set(ref(student, `misses/student/${physics.id}`), {
    selected: "newton",
    matched: false,
    submittedAt: Date.now(),
  }));
  await assertFails(set(ref(student, `repairs/student/${physics.id}`), { answer: "", submittedAt: Date.now() }));
  await assertSucceeds(set(ref(student, `repairs/student/${physics.id}`), repair));
  await assertFails(set(ref(student, `repairs/student/${physics.id}`), {
    answer: "A second try.",
    submittedAt: Date.now(),
  }));
  const own = await get(ref(student, `repairs/student/${physics.id}`));
  assert.equal(own.val().answer, repair.answer);
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await set(ref(context.database(), "roles/parent/parent"), true);
  });
  const parent = testEnv.authenticatedContext("parent").database();
  const listed = await get(ref(parent, "repairs"));
  assert.equal(listed.val().student[physics.id].answer, repair.answer);
  await assertFails(get(ref(student, "repairs")));
});

test("a parent can read the key and a student cannot", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await set(ref(context.database(), "roles/parent/parent"), true);
  });
  const parent = testEnv.authenticatedContext("parent").database();
  const guide = await get(ref(parent, `guides/${physics.id}`));
  assert.equal(guide.val().answer, physics.answer);
  const student = testEnv.authenticatedContext("student").database();
  await assertFails(get(ref(student, `guides/${physics.id}`)));
});
