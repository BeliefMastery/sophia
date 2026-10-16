import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { equalTo, get, onValue, orderByChild, push, query, ref, set } from "firebase/database";
import { claims, judgePlacement } from "../lib/claims.mjs";
import { recordChoice } from "../lib/recordChoice.mjs";
import { checkRows, openRepair, orderedChoices } from "../lib/records.mjs";
import { auth, db, firebaseConfig, useEmulators } from "./firebase.js";
import { resourceList } from "../lib/explain.mjs";
import { rewardFor } from "../lib/rewards.mjs";
import { fieldMarks } from "../lib/expansion.mjs";
import { Admin } from "./Admin.jsx";
import { Reward } from "./Reward.jsx";
import { DepthChart } from "./Depth.jsx";
import { Scene, sceneFor } from "./scenes.jsx";

const signInMessages = {
  "auth/invalid-credential": "That email or password did not match.",
  "auth/invalid-login-credentials": "That email or password did not match.",
  "auth/wrong-password": "That email or password did not match.",
  "auth/user-not-found": "That email or password did not match.",
  "auth/operation-not-allowed": "Email sign-in is not turned on for this project yet.",
  "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
};

function listFromSnapshot(value) {
  if (!value) return [];
  return Object.entries(value).map(([id, record]) => ({ id, ...record }));
}

export function App() {
  const [user, setUser] = useState(undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signInError, setSignInError] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [items, setItems] = useState(null);
  const [attempts, setAttempts] = useState(null);
  const [parent, setParent] = useState(null);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);
  const [recordError, setRecordError] = useState("");
  const [repairs, setRepairs] = useState(null);
  const [guides, setGuides] = useState({});
  const [pendingRepair, setPendingRepair] = useState(null);
  const [repairDraft, setRepairDraft] = useState("");
  const savingRef = useRef(false);
  const headingRef = useRef(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) return undefined;
    const itemQuery = query(ref(db, "items"), orderByChild("strandId"), equalTo("placement-check"));
    const unsubItems = onValue(itemQuery, (snapshot) => setItems(listFromSnapshot(snapshot.val())));
    const unsubAttempts = onValue(ref(db, `attempts/${user.uid}`), (snapshot) => {
      setAttempts(listFromSnapshot(snapshot.val()));
    });
    const unsubRole = onValue(ref(db, `roles/${user.uid}/parent`), (snapshot) => {
      setParent(snapshot.val() === true);
    });
    const unsubRepairs = onValue(ref(db, `repairs/${user.uid}`), (snapshot) => {
      setRepairs(snapshot.val() || {});
    });
    return () => {
      unsubItems();
      unsubAttempts();
      unsubRole();
      unsubRepairs();
    };
  }, [user]);

  useEffect(() => {
    if (user) return;
    setPendingRepair(null);
    setGuides({});
    setRepairDraft("");
    setRepairs(null);
  }, [user]);

  const progress = useMemo(() => {
    if (!items) return null;
    return checkRows(items, attempts || []);
  }, [items, attempts]);

  const dueRepair = useMemo(() => {
    if (!items || !attempts || repairs === null) return null;
    return openRepair(items, attempts, repairs);
  }, [items, attempts, repairs]);

  const activeRepair = dueRepair
    || (pendingRepair && !(typeof repairs?.[pendingRepair.item.id]?.answer === "string" && repairs[pendingRepair.item.id].answer.trim())
      ? pendingRepair
      : null);

  useEffect(() => {
    if (!pendingRepair || repairs === null) return;
    const saved = repairs[pendingRepair.item.id]?.answer;
    if (typeof saved === "string" && saved.trim()) setPendingRepair(null);
  }, [repairs, pendingRepair]);

  useEffect(() => {
    const itemId = activeRepair?.item?.id;
    if (!user || !itemId || guides[itemId]) return undefined;
    let cancel = false;
    let timer = 0;
    async function load(attempt) {
      try {
        const snapshot = await get(ref(db, `guides/${itemId}`));
        if (cancel) return;
        setGuides((current) => ({ ...current, [itemId]: snapshot.val() || {} }));
        setRecordError("");
      } catch {
        if (cancel) return;
        if (attempt < 4) {
          timer = window.setTimeout(() => load(attempt + 1), 200);
          return;
        }
        setRecordError("The next question did not load. Try it again.");
      }
    }
    load(0);
    return () => {
      cancel = true;
      window.clearTimeout(timer);
    };
  }, [user, activeRepair?.item?.id, guides]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [progress?.next?.id, progress?.complete, user, activeRepair?.item?.id]);

  async function onSignIn(event) {
    event.preventDefault();
    setSigningIn(true);
    setSignInError("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword("");
    } catch (error) {
      setSignInError(signInMessages[error.code] || "Sign-in did not complete.");
    } finally {
      setSigningIn(false);
    }
  }

  async function onRecord() {
    if (!progress?.next || !selected || savingRef.current || activeRepair) return;
    savingRef.current = true;
    setSaving(true);
    setRecordError("");
    const item = progress.next;
    const attemptRef = push(ref(db, `attempts/${user.uid}`));
    const payload = {
      itemId: item.id,
      strandId: item.strandId,
      ideaId: item.ideaId,
      answerKind: "choice",
      selected,
      submittedAt: Date.now(),
    };
    try {
      const matched = await recordChoice((body) => set(attemptRef, body), payload);
      if (!matched) {
        const missRef = ref(db, `misses/${user.uid}/${item.id}`);
        try {
          await set(missRef, { selected, matched: false, submittedAt: payload.submittedAt });
        } catch (error) {
          if (error?.code !== "PERMISSION_DENIED") throw error;
        }
        setRepairDraft("");
        setPendingRepair({ item, selected });
      }
      setSelected("");
    } catch {
      setPendingRepair(null);
      setRecordError("That answer was not recorded. Try it again.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function onRepair() {
    const text = repairDraft.trim();
    if (!activeRepair || !text || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setRecordError("");
    try {
      await set(ref(db, `repairs/${user.uid}/${activeRepair.item.id}`), {
        answer: text,
        submittedAt: Date.now(),
      });
      setRepairDraft("");
    } catch {
      setRecordError("That written answer was not saved. Try it again.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  if (user === undefined) {
    return <Shell><p className="quiet">Loading…</p></Shell>;
  }

  if (!useEmulators && !firebaseConfig.apiKey) {
    return (
      <Shell>
        <Bezel plate="Sophia" aside="Sign in" scene="study">
          <h1 ref={headingRef} tabIndex={-1}>The web app key is not in this build yet.</h1>
          <p>The placement check is ready. Email sign-in needs the Firebase web key before a real login can open it.</p>
        </Bezel>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <Bezel plate="Sophia" aside="Sign in" scene="study">
          <h1 ref={headingRef} tabIndex={-1}>Placement check</h1>
          <p>Sign in with the account made for you. The first session is a set of multiple-choice questions.</p>
          <form onSubmit={onSignIn} className="sign-in">
            <label>
              Email
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {signInError ? <p className="alert" role="alert">{signInError}</p> : null}
            <button type="submit" className="primary" disabled={signingIn}>
              {signingIn ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="quiet">Practice on this site is not an NCEA assessment.</p>
        </Bezel>
      </Shell>
    );
  }

  if (parent) {
    return (
      <Shell user={user}>
        <Admin user={user} />
      </Shell>
    );
  }

  if (!items || !attempts || repairs === null || parent === null) {
    return <Shell user={user}><p className="quiet">Loading the check…</p></Shell>;
  }

  if (items.length === 0) {
    return (
      <Shell user={user}>
        <Bezel plate="Placement" aside="Empty">
          <h1 ref={headingRef} tabIndex={-1}>The placement questions are not loaded.</h1>
          <p>The check has nowhere to read from yet.</p>
        </Bezel>
      </Shell>
    );
  }

  if (activeRepair) {
    const guide = guides[activeRepair.item.id];
    const resources = resourceList(guide?.discover);
    const chosen = activeRepair.item.choices?.[activeRepair.selected]?.text || "";
    const follow = typeof guide?.followPrompt === "string" ? guide.followPrompt : "";
    return (
      <Shell user={user}>
        <Bezel plate="Discovery" aside="Written answer" scene="discovery">
          <p>That choice did not match. The choices are closed.</p>
          {chosen ? <p className="quiet">Your choice: {chosen}</p> : null}
          {!follow ? <p className="quiet">Loading the next question…</p> : (
            <>
              <p>Use a resource, then answer the new question in your own words.</p>
              <ul className="resources">
                {resources.map((entry) => (
                  <li key={entry.href || entry.label}>
                    {entry.href ? (
                      <a href={entry.href} target="_blank" rel="noopener noreferrer">{entry.label}</a>
                    ) : (
                      <p className="search-line">{entry.label}</p>
                    )}
                  </li>
                ))}
              </ul>
              <h1 ref={headingRef} tabIndex={-1} className="prompt">{follow}</h1>
              <label>
                Your answer
                <textarea
                  value={repairDraft}
                  onChange={(event) => setRepairDraft(event.target.value)}
                  maxLength={2000}
                  rows={5}
                />
              </label>
            </>
          )}
          {recordError ? <p className="alert" role="alert">{recordError}</p> : null}
          <button type="button" className="primary" disabled={!follow || !repairDraft.trim() || saving} onClick={onRepair}>
            {saving ? "Saving…" : "Save this answer"}
          </button>
        </Bezel>
      </Shell>
    );
  }

  if (!progress.complete) {
    const item = progress.next;
    const claim = claims.find((entry) => entry.id === item.claim);
    const answered = items.filter((entry) => entry.order < item.order).length;
    const choices = orderedChoices(item.choices);
    return (
      <Shell user={user}>
        <Bezel plate={claim?.title || "Question"} aside={`${answered + 1} of ${items.length}`} scene={sceneFor(item.claim)}>
          <div className="meter" aria-hidden="true">
            <span style={{ width: `${(answered / items.length) * 100}%` }} />
          </div>
          {answered === 0 ? (
            <details>
              <summary>What this check is</summary>
              <p>
                Thirty-three questions, three for each note from October 2026. They ask what you know.
                The result says whether each note still fits. You can sign out and continue later.
                Answered questions stay answered.
              </p>
            </details>
          ) : null}
          <h1 ref={headingRef} tabIndex={-1} className="prompt">{item.prompt}</h1>
          <div className="choices" role="group" aria-label="Choices">
            {choices.map((choice, index) => (
              <button
                key={choice.id}
                type="button"
                className={selected === choice.id ? "choice is-selected" : "choice"}
                aria-pressed={selected === choice.id}
                disabled={saving}
                onClick={() => setSelected(choice.id)}
              >
                <span className="choice-mark">{String.fromCharCode(65 + index)}</span>
                <span>{choice.text}</span>
              </button>
            ))}
          </div>
          {recordError ? <p className="alert" role="alert">{recordError}</p> : null}
          <button type="button" className="primary" disabled={!selected || saving} onClick={onRecord}>
            {saving ? "Recording…" : "Record this answer"}
          </button>
        </Bezel>
      </Shell>
    );
  }

  const verdicts = judgePlacement(claims, progress.byClaim);
  const marks = fieldMarks(verdicts, items, attempts, repairs);
  const validatedCount = verdicts.filter((verdict) => verdict.validated).length;
  const rewards = verdicts.map((verdict) => rewardFor(verdict)).filter(Boolean);
  const excellentCount = rewards.filter((reward) => reward.level === "excellent").length;
  const achievementCount = rewards.filter((reward) => reward.level === "achievement").length;

  return (
    <Shell user={user}>
      <Bezel plate="Placement check" aside="Result" scene="reward">
        <h1 ref={headingRef} tabIndex={-1}>
          {excellentCount} excellent {excellentCount === 1 ? "achievement" : "achievements"}. {achievementCount} {achievementCount === 1 ? "achievement" : "achievements"}.
        </h1>
        <p>
          Excellent achievement means the work is above the usual Year 10 level for age 15.
          Achievement means the answers met the October note, or went past a note that sat below that Year 10 line.
          A weak note that simply holds is not a reward.
        </p>
        <p className="quiet">
          {validatedCount} {validatedCount === 1 ? "note still matches" : "notes still match"} October. {verdicts.length - validatedCount} {verdicts.length - validatedCount === 1 ? "does" : "do"} not.
          This does not award NCEA. Management was not scored: it is an interest, not a claimed level.
        </p>
      </Bezel>
      <Bezel plate="Depth" aside="Age tiers" scene="reward">
        <h2>How far each field goes</h2>
        <DepthChart marks={marks} />
      </Bezel>
      {verdicts.map((verdict) => {
        const mark = marks.find((entry) => entry.claimId === verdict.claimId);
        const reward = rewardFor(verdict);
        const plate = reward ? reward.title : verdict.validated ? "Validated" : "Invalidated";
        const tone = reward ? reward.level : verdict.validated ? "validated" : "invalidated";
        return (
        <Bezel
          key={verdict.claimId}
          plate={plate}
          aside={verdict.title}
          tone={tone}
          scene={sceneFor(verdict.claimId)}
        >
          <Reward verdict={verdict} />
          {mark ? <p className="quiet">Depth {mark.depth}. {mark.label}. The peer line is Year 10, age 15.</p> : null}
          <p className="note">Note: {verdict.assessment}</p>
          <h2>{verdict.text}</h2>
          <p className="quiet">{verdict.support} of {verdict.total} {verdict.support === 1 ? "answer fits" : "answers fit"} the note.</p>
          <details>
            <summary>The three answers</summary>
            <ul className="answer-list">
              {(progress.byClaim.get(verdict.claimId) || []).map((row) => {
                const fits = row.predict === "known" ? row.matched : !row.matched;
                const chosen = row.item.choices?.[row.selected]?.text || "No choice recorded";
                return (
                  <li key={row.item.id}>
                    <p className="prompt-small">{row.item.prompt}</p>
                    <p>Chosen: {chosen}</p>
                    <p>{row.matched ? "Matched the key." : "Did not match the key."} {fits ? "Fits the note." : "Does not fit the note."}</p>
                  </li>
                );
              })}
            </ul>
          </details>
        </Bezel>
        );
      })}
    </Shell>
  );
}

function Shell({ user, children }) {
  return (
    <main className="shell">
      <header className="top">
        <p className="wordmark">Sophia</p>
        {user ? (
          <button type="button" className="text" onClick={() => signOut(auth)}>Sign out</button>
        ) : null}
      </header>
      {children}
      <footer className="files">
        <a href="https://github.com/BeliefMastery/sophia">Project files on GitHub</a>
        <a href="https://github.com/BeliefMastery/sophia/archive/refs/heads/cursor/sophia-learning-plan-88e9.zip">Download this copy</a>
      </footer>
    </main>
  );
}

function Bezel({ plate, aside, tone, scene, children }) {
  return (
    <section className={tone ? `bezel is-${tone}` : "bezel"}>
      <div className="bezel-plate">
        <span>{plate}</span>
        <span>{aside}</span>
      </div>
      <div className="bezel-screen">
        {scene ? <Scene name={scene} /> : null}
        {children}
      </div>
    </section>
  );
}
