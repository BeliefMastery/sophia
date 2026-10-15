import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { equalTo, get, onValue, orderByChild, push, query, ref, set } from "firebase/database";
import { claims, judgePlacement } from "../lib/claims.mjs";
import { recordChoice } from "../lib/recordChoice.mjs";
import { checkRows, orderedChoices } from "../lib/records.mjs";
import { auth, db, firebaseConfig, useEmulators } from "./firebase.js";
import { explainMiss } from "../lib/explain.mjs";
import { Admin } from "./Admin.jsx";

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
  const [reveal, setReveal] = useState(null);
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
    return () => {
      unsubItems();
      unsubAttempts();
      unsubRole();
    };
  }, [user]);

  const progress = useMemo(() => {
    if (!items) return null;
    return checkRows(items, attempts || []);
  }, [items, attempts]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [progress?.next?.id, progress?.complete, user, reveal?.item?.id]);

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
    if (!progress?.next || !selected || savingRef.current) return;
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
        setReveal({ item, selected, pending: true });
        const missRef = ref(db, `misses/${user.uid}/${item.id}`);
        try {
          await set(missRef, { selected, matched: false, submittedAt: payload.submittedAt });
        } catch (error) {
          if (error?.code !== "PERMISSION_DENIED") throw error;
        }
        const guide = (await get(ref(db, `guides/${item.id}`))).val() || {};
        setReveal({ item, selected, guide });
      }
      setSelected("");
    } catch {
      setReveal(null);
      setRecordError("That answer was not recorded. Try it again.");
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
        <Bezel plate="Sophia" aside="Sign in">
          <h1 ref={headingRef} tabIndex={-1}>The web app key is not in this build yet.</h1>
          <p>The placement check is ready. Email sign-in needs the Firebase web key before a real login can open it.</p>
        </Bezel>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <Bezel plate="Sophia" aside="Sign in">
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

  if (reveal) {
    const explained = explainMiss(reveal.item, reveal.guide);
    const chosen = reveal.item.choices?.[reveal.selected]?.text || "";
    return (
      <Shell user={user}>
        <Bezel plate="Answer" aside="Explanation">
          <h1 ref={headingRef} tabIndex={-1} className="prompt">{reveal.item.prompt}</h1>
          {reveal.pending ? <p className="quiet">Loading the explanation…</p> : (
            <>
              <p>Your choice: {chosen}</p>
              <p className="reveal-answer">Answer: {explained.answerText}</p>
              {explained.explanation.map((line) => <p key={line}>{line}</p>)}
              {explained.slips.map((line) => <p key={line} className="quiet">{line}</p>)}
            </>
          )}
          <button type="button" className="primary" onClick={() => setReveal(null)} disabled={reveal.pending}>Continue</button>
        </Bezel>
      </Shell>
    );
  }

  if (!items || !attempts || parent === null) {
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

  if (!progress.complete) {
    const item = progress.next;
    const claim = claims.find((entry) => entry.id === item.claim);
    const answered = items.filter((entry) => entry.order < item.order).length;
    const choices = orderedChoices(item.choices);
    return (
      <Shell user={user}>
        <Bezel plate={claim?.title || "Question"} aside={`${answered + 1} of ${items.length}`}>
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
  const validatedCount = verdicts.filter((verdict) => verdict.validated).length;

  return (
    <Shell user={user}>
      <Bezel plate="Placement check" aside="Result">
        <h1 ref={headingRef} tabIndex={-1}>
          {validatedCount} {validatedCount === 1 ? "note" : "notes"} validated. {verdicts.length - validatedCount} {verdicts.length - validatedCount === 1 ? "note" : "notes"} invalidated.
        </h1>
        <p>
          This reads the October 2026 notes against the first answer for each question.
          It does not award NCEA. Management was not scored: it is an interest, not a claimed level.
        </p>
      </Bezel>
      {verdicts.map((verdict) => (
        <Bezel
          key={verdict.claimId}
          plate={verdict.validated ? "Validated" : "Invalidated"}
          aside={verdict.title}
          tone={verdict.validated ? "validated" : "invalidated"}
        >
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
      ))}
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
    </main>
  );
}

function Bezel({ plate, aside, tone, children }) {
  return (
    <section className={tone ? `bezel is-${tone}` : "bezel"}>
      <div className="bezel-plate">
        <span>{plate}</span>
        <span>{aside}</span>
      </div>
      <div className="bezel-screen">{children}</div>
    </section>
  );
}
