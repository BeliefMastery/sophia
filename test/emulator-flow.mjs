import test from "node:test";
import assert from "node:assert/strict";
import { initializeApp } from "firebase/app";
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { connectDatabaseEmulator, equalTo, get, getDatabase, goOffline, orderByChild, push, query, ref, set } from "firebase/database";
import { deleteApp } from "firebase/app";
import { items } from "../content/placement-check.mjs";
import { claims, judgePlacement } from "../lib/claims.mjs";
import { recordChoice } from "../lib/recordChoice.mjs";
import { checkRows } from "../lib/records.mjs";

const app = initializeApp({
  apiKey: "demo",
  authDomain: "demo-sophia.firebaseapp.com",
  databaseURL: "https://demo-sophia-default-rtdb.firebaseio.com",
  projectId: "demo-sophia",
  appId: "demo",
});
const auth = getAuth(app);
const db = getDatabase(app);
const databaseHost = process.env.FIREBASE_DATABASE_EMULATOR_HOST || "127.0.0.1:9000";
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
const [dbName, dbPort] = databaseHost.split(":");
connectAuthEmulator(auth, `http://${authHost}`, { disableWarnings: true });
connectDatabaseEmulator(db, dbName, Number(dbPort));

async function signIn() {
  const email = "student@example.test";
  const password = "local-only";
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    if (error.code !== "auth/email-already-in-use") throw error;
  }
  return signInWithEmailAndPassword(auth, email, password);
}

test.after(async () => {
  await signOut(auth).catch(() => {});
  goOffline(db);
  await deleteApp(app);
});

test("a signed-in student can finish the check and the notes are judged from the rules", async () => {
  const credential = await signIn();
  const uid = credential.user.uid;
  const loaded = await get(query(ref(db, "items"), orderByChild("strandId"), equalTo("placement-check")));
  const published = Object.entries(loaded.val() || {}).map(([id, item]) => ({ id, ...item }));
  assert.equal(published.length, 33);
  try {
    await get(ref(db, "guides/check-math-1"));
    assert.fail("student read the guide");
  } catch (error) {
    assert.match(`${error.code || ""} ${error.message || ""}`, /permission/i);
  }

  const missedChoices = { "check-math-1": "two", "check-math-2": "nine" };
  for (const [missedId, selected] of Object.entries(missedChoices)) {
    const missed = published.find((item) => item.id === missedId);
    const missedRef = push(ref(db, `attempts/${uid}`));
    const missedMatch = await recordChoice((body) => set(missedRef, body), {
      itemId: missed.id,
      strandId: missed.strandId,
      ideaId: missed.ideaId,
      answerKind: "choice",
      selected,
      submittedAt: missed.order,
    });
    assert.equal(missedMatch, false, missedId);
  }

  for (const source of items) {
    if (source.id === "check-math-1" || source.id === "check-math-2") continue;
    const item = published.find((entry) => entry.id === source.id);
    const selected = source.predict === "known"
      ? source.answer
      : source.choices.find((choice) => choice.id !== source.answer).id;
    const attemptRef = push(ref(db, `attempts/${uid}`));
    const matched = await recordChoice((body) => set(attemptRef, body), {
      itemId: item.id,
      strandId: item.strandId,
      ideaId: item.ideaId,
      answerKind: "choice",
      selected,
      submittedAt: source.order,
    });
    assert.equal(matched, source.predict === "known", source.id);
  }

  const attempts = Object.values((await get(ref(db, `attempts/${uid}`))).val());
  const progress = checkRows(published, attempts);
  assert.equal(progress.complete, true);
  const verdicts = judgePlacement(claims, progress.byClaim);
  const mathsVerdict = verdicts.find((verdict) => verdict.claimId === "mathematics");
  assert.equal(mathsVerdict.validated, false);
  assert.equal(mathsVerdict.direction, "behind");
  for (const verdict of verdicts) {
    if (verdict.claimId !== "mathematics") assert.equal(verdict.validated, true, verdict.claimId);
  }
});
