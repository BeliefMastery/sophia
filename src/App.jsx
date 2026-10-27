import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { get, onValue, push, ref, set } from "firebase/database";
import { recordChoice } from "../lib/recordChoice.mjs";
import { orderedChoices } from "../lib/records.mjs";
import { auth, db, firebaseConfig, useEmulators } from "./firebase.js";
import { passageParagraphs } from "../lib/explain.mjs";
import { fieldPlace, fieldStudy, nextFieldStep, paceLabelFor, paceLabels } from "../lib/expansion.mjs";
import { markRepair, reviewRecord } from "../lib/markRepair.mjs";
import { Admin } from "./Admin.jsx";
import { InterestVote } from "./InterestVote.jsx";
import { KnowledgeTree } from "./KnowledgeTree.jsx";
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
  const [library, setLibrary] = useState(null);
  const [strands, setStrands] = useState(null);
  const [chosenField, setChosenField] = useState("");
  const [attempts, setAttempts] = useState(null);
  const [parent, setParent] = useState(null);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);
  const [recordError, setRecordError] = useState("");
  const [repairs, setRepairs] = useState(null);
  const [guides, setGuides] = useState({});
  const [pendingRepair, setPendingRepair] = useState(null);
  const [repairDraft, setRepairDraft] = useState("");
  const [catalog, setCatalog] = useState(null);
  const [entranceCatalog, setEntranceCatalog] = useState(null);
  const [tree, setTree] = useState(null);
  const [interests, setInterests] = useState(null);
  const [entrance, setEntrance] = useState(null);
  const [pace, setPace] = useState(null);
  const [interestSaving, setInterestSaving] = useState(false);
  const [interestError, setInterestError] = useState("");
  const [entranceSaving, setEntranceSaving] = useState(false);
  const [entranceError, setEntranceError] = useState("");
  const [paceSaving, setPaceSaving] = useState(false);
  const [paceError, setPaceError] = useState("");
  const [paceDraft, setPaceDraft] = useState(3);
  const [writtenDraft, setWrittenDraft] = useState("");
  const [sourceCache, setSourceCache] = useState({});
  const [studyMode, setStudyMode] = useState(() => {
    try {
      return sessionStorage.getItem("sophia-study-mode") === "1";
    } catch {
      return false;
    }
  });
  const savingRef = useRef(false);
  const headingRef = useRef(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    try {
      if (studyMode) sessionStorage.setItem("sophia-study-mode", "1");
      else sessionStorage.removeItem("sophia-study-mode");
    } catch {
      // sessionStorage may be unavailable
    }
  }, [studyMode]);

  useEffect(() => {
    if (!user) return undefined;
    const unsubItems = onValue(ref(db, "items"), (snapshot) => setLibrary(listFromSnapshot(snapshot.val())));
    const unsubStrands = onValue(ref(db, "strands"), (snapshot) => setStrands(snapshot.val() || {}));
    const unsubAttempts = onValue(ref(db, `attempts/${user.uid}`), (snapshot) => {
      setAttempts(listFromSnapshot(snapshot.val()));
    });
    const unsubRole = onValue(ref(db, `roles/${user.uid}/parent`), (snapshot) => {
      setParent(snapshot.val() === true);
    });
    const unsubRepairs = onValue(ref(db, `repairs/${user.uid}`), (snapshot) => {
      setRepairs(snapshot.val() || {});
    });
    const unsubCatalog = onValue(ref(db, "catalog/interests"), (snapshot) => {
      setCatalog(snapshot.val() || {});
    });
    const unsubEntranceCatalog = onValue(ref(db, "catalog/entrance"), (snapshot) => {
      setEntranceCatalog(snapshot.val() || {});
    });
    const unsubTree = onValue(ref(db, "catalog/tree"), (snapshot) => {
      setTree(snapshot.val() || {});
    });
    const unsubInterests = onValue(ref(db, `interests/${user.uid}`), (snapshot) => {
      setInterests(snapshot.val() || {});
    });
    const unsubEntrance = onValue(ref(db, `entrance/${user.uid}`), (snapshot) => {
      setEntrance(snapshot.val() || {});
    });
    const unsubPace = onValue(ref(db, `pace/${user.uid}`), (snapshot) => {
      setPace(snapshot.val() || {});
    });
    return () => {
      unsubItems();
      unsubStrands();
      unsubAttempts();
      unsubRole();
      unsubRepairs();
      unsubCatalog();
      unsubEntranceCatalog();
      unsubTree();
      unsubInterests();
      unsubEntrance();
      unsubPace();
    };
  }, [user]);

  useEffect(() => {
    if (user) return;
    setPendingRepair(null);
    setGuides({});
    setRepairDraft("");
    setRepairs(null);
    setChosenField("");
    setCatalog(null);
    setEntranceCatalog(null);
    setTree(null);
    setInterests(null);
    setEntrance(null);
    setPace(null);
    setInterestError("");
    setEntranceError("");
    setPaceError("");
    setPaceDraft(3);
    setStudyMode(false);
  }, [user]);

  const fields = useMemo(
    () => fieldStudy(strands || {}, library || [], attempts || [], repairs || {}),
    [strands, library, attempts, repairs],
  );
  const step = useMemo(() => {
    if (!chosenField || !library) return null;
    return nextFieldStep(strands || {}, library, attempts || [], repairs || {}, chosenField);
  }, [chosenField, strands, library, attempts, repairs]);
  const fieldRepair = step?.kind === "repair" ? { item: step.item, selected: step.selected } : null;
  const pendingHere = Boolean(
    pendingRepair?.item?.id
    && chosenField
    && fieldPlace(strands || {}, library || [], pendingRepair.item).id === chosenField
    && !(typeof repairs?.[pendingRepair.item.id]?.answer === "string" && repairs[pendingRepair.item.id].answer.trim()),
  );
  const activeRepair = chosenField ? (pendingHere ? pendingRepair : fieldRepair) : null;

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
  }, [user, chosenField, step?.item?.id, step?.kind, activeRepair?.item?.id]);

  useEffect(() => {
    if (!chosenField || !pace) return;
    const saved = Number(pace[chosenField]?.rating);
    setPaceDraft(saved >= 1 && saved <= 5 ? saved : 3);
    setPaceError("");
  }, [chosenField, pace]);

  useEffect(() => {
    const sourceId = step?.item?.sourceId;
    if (!user || !sourceId) return undefined;
    let cancel = false;
    get(ref(db, `sources/${sourceId}`)).then((snapshot) => {
      if (cancel) return;
      setSourceCache((current) => {
        if (current[sourceId]) return current;
        return { ...current, [sourceId]: snapshot.val() || { title: sourceId, body: "" } };
      });
    }).catch(() => {
      if (cancel) return;
      setSourceCache((current) => {
        if (current[sourceId]) return current;
        return { ...current, [sourceId]: { title: sourceId, body: "" } };
      });
    });
    return () => { cancel = true; };
  }, [user, step?.item?.sourceId]);

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

  async function onRecordWritten() {
    const item = step?.kind === "written" ? step.item : null;
    const text = writtenDraft.trim();
    if (!item || !text || savingRef.current || activeRepair) return;
    savingRef.current = true;
    setSaving(true);
    setRecordError("");
    const attemptRef = push(ref(db, `attempts/${user.uid}`));
    try {
      await set(attemptRef, {
        itemId: item.id,
        strandId: item.strandId,
        ideaId: item.ideaId,
        answerKind: item.answerKind || "essay",
        answer: text,
        submittedAt: Date.now(),
      });
      setWrittenDraft("");
    } catch {
      setRecordError("That written answer was not recorded. Try it again.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function onRecord() {
    const item = step?.kind === "question" ? step.item : null;
    if (!item || !selected || savingRef.current || activeRepair) return;
    savingRef.current = true;
    setSaving(true);
    setRecordError("");
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
    const itemId = activeRepair.item.id;
    const submittedAt = Date.now();
    try {
      await set(ref(db, `repairs/${user.uid}/${itemId}`), {
        answer: text,
        submittedAt,
      });
      try {
        const guide = guides[itemId] || {};
        const mark = markRepair(text, guide);
        await set(ref(db, `reviews/${user.uid}/${itemId}`), reviewRecord(itemId, mark, submittedAt));
      } catch {
        // Repair already saved; auto-mark is secondary.
      }
      setRepairDraft("");
    } catch {
      setRecordError("That written answer was not saved. Try it again.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function onInterestSave(nextInterests) {
    if (!user || interestSaving) return;
    setInterestSaving(true);
    setInterestError("");
    try {
      await set(ref(db, `interests/${user.uid}`), nextInterests);
    } catch {
      setInterestError("Those interests were not saved. Try it again.");
    } finally {
      setInterestSaving(false);
    }
  }

  async function onEntranceSave(nextEntrance) {
    if (!user || entranceSaving) return;
    setEntranceSaving(true);
    setEntranceError("");
    try {
      await set(ref(db, `entrance/${user.uid}`), nextEntrance);
    } catch {
      setEntranceError("Those entrance subjects were not saved. Try it again.");
    } finally {
      setEntranceSaving(false);
    }
  }

  async function onPaceSave(fieldId, rating) {
    if (!user || !fieldId || paceSaving) return;
    const value = Math.min(5, Math.max(1, Number(rating) || 3));
    const label = paceLabelFor(value);
    if (!label) return;
    setPaceSaving(true);
    setPaceError("");
    try {
      await set(ref(db, `pace/${user.uid}/${fieldId}`), {
        rating: value,
        label,
        submittedAt: Date.now(),
      });
    } catch {
      setPaceError("That difficulty rating was not saved. Try it again.");
    } finally {
      setPaceSaving(false);
    }
  }

  if (user === undefined) {
    return <Shell><p className="quiet">Loading…</p></Shell>;
  }

  if (!useEmulators && !firebaseConfig.apiKey) {
    return (
      <Shell>
        <Bezel plate="Sophia" aside="Sign in" scene="study">
          <h1 ref={headingRef} tabIndex={-1}>Sign-in is not ready in this build yet.</h1>
          <p>The questions are prepared, but this copy of the site still needs its web sign-in key before you can log in.</p>
        </Bezel>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <Bezel plate="Sophia" aside="Sign in" scene="study">
          <h1 ref={headingRef} tabIndex={-1}>Sophia</h1>
          <p>Sign in with the account made for you, then choose a subject to study.</p>
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
          <p className="quiet">Practising here is not an official NCEA assessment.</p>
        </Bezel>
      </Shell>
    );
  }

  if (parent && !studyMode) {
    return (
      <Shell user={user}>
        <Admin user={user} onStudy={() => setStudyMode(true)} />
      </Shell>
    );
  }

  if (!library || !strands || !attempts || repairs === null || parent === null || catalog === null || entranceCatalog === null || tree === null || interests === null || entrance === null || pace === null) {
    return <Shell user={user}><p className="quiet">Loading your map…</p></Shell>;
  }

  function goHome() {
    setSelected("");
    setWrittenDraft("");
    setRecordError("");
    setChosenField("");
  }

  const shellProps = {
    user,
    onAdmin: parent ? () => { setChosenField(""); setStudyMode(false); } : null,
    onHome: chosenField ? goHome : null,
  };

  const interestPanel = (
    <InterestVote
      catalog={catalog}
      interests={interests}
      onSave={onInterestSave}
      saving={interestSaving}
      error={interestError}
    />
  );

  if (!library.length) {
    return (
      <Shell {...shellProps}>
        <Bezel plate="Fields" aside="Empty">
          <h1 ref={headingRef} tabIndex={-1}>The questions have not loaded yet.</h1>
          <p>There is no subject to open right now.</p>
        </Bezel>
      </Shell>
    );
  }

  const current = fields.find((field) => field.id === chosenField);
  if (!current) {
    return (
      <Shell {...shellProps}>
        <Bezel plate="Knowledge map" aside="Entrance" scene="study">
          <h1 ref={headingRef} tabIndex={-1}>University Entrance map</h1>
          <p>Choose an open subject. Later subjects unlock when you finish the ones that come before them.</p>
          {parent ? <p className="quiet">You are practising as a student. Answers save on this admin login so you can review them in the report.</p> : null}
          <KnowledgeTree
            tree={tree}
            fields={fields}
            interests={interests}
            entrance={entrance}
            entranceCatalog={entranceCatalog}
            onStudy={(fieldId) => {
              setSelected("");
              setWrittenDraft("");
              setPendingRepair(null);
              setChosenField(fieldId);
            }}
            onSaveInterests={onInterestSave}
            onSaveEntrance={onEntranceSave}
            savingInterest={interestSaving}
            savingEntrance={entranceSaving}
            interestError={interestError}
            entranceError={entranceError}
          />
        </Bezel>
      </Shell>
    );
  }

  if (activeRepair) {
    const guide = guides[activeRepair.item.id];
    const paragraphs = passageParagraphs(guide?.passage);
    const chosen = activeRepair.item.choices?.[activeRepair.selected]?.text || "";
    const follow = typeof guide?.followPrompt === "string" ? guide.followPrompt : "";
    return (
      <Shell {...shellProps}>
        <Bezel plate="Discovery" aside="Written answer" scene="discovery">
          <p>That answer was not right, so the multiple-choice options are closed for this question.</p>
          {chosen ? <p className="quiet">You chose: {chosen}</p> : null}
          {!follow || paragraphs.length < 2 ? <p className="quiet">Loading the short reading…</p> : (
            <>
              <p>Read the short explanation below, then answer the new question using only what that reading says.</p>
              <div className="passage">
                {paragraphs.map((paragraph, index) => (
                  <p key={`passage-${index}`}>{paragraph}</p>
                ))}
              </div>
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
          <button type="button" className="primary" disabled={paragraphs.length < 2 || !follow || !repairDraft.trim() || saving} onClick={onRepair}>
            {saving ? "Saving…" : "Save this answer"}
          </button>
          <button type="button" className="text" onClick={() => { setWrittenDraft(""); setChosenField(""); }}>Back to map</button>
        </Bezel>
      </Shell>
    );
  }

  if (step?.kind === "written" && step.item) {
    const item = step.item;
    const source = item.sourceId ? sourceCache[item.sourceId] : null;
    const wordList = Array.isArray(item.words) ? item.words : [];
    return (
      <Shell {...shellProps}>
        <Bezel plate={current.title} aside={`${step.index} of ${step.total}`} scene={sceneFor(current.id)}>
          <div className="meter" aria-hidden="true">
            <span style={{ width: `${((step.index - 1) / step.total) * 100}%` }} />
          </div>
          <h1 ref={headingRef} tabIndex={-1} className="prompt">{item.prompt}</h1>
          {wordList.length ? (
            <details className="study-panel">
              <summary>Words for this question</summary>
              <ul className="study-words">
                {wordList.map((word) => (
                  <li key={word.term}>
                    <strong>{word.term}</strong>
                    {" — "}
                    {word.meaning}
                    {word.example ? <span className="quiet"> Example: {word.example}</span> : null}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
          {item.sourceId ? (
            <details className="study-panel">
              <summary>{source?.title || "Source reading"}</summary>
              {source?.body
                ? <pre className="study-source">{source.body}</pre>
                : <p className="quiet">Loading the source…</p>}
            </details>
          ) : null}
          <label>
            Your answer
            <textarea
              value={writtenDraft}
              onChange={(event) => setWrittenDraft(event.target.value)}
              maxLength={8000}
              rows={10}
            />
          </label>
          {recordError ? <p className="alert" role="alert">{recordError}</p> : null}
          <button type="button" className="primary" disabled={!writtenDraft.trim() || saving} onClick={onRecordWritten}>
            {saving ? "Recording…" : "Record this answer"}
          </button>
          <button type="button" className="text" onClick={() => { setWrittenDraft(""); setChosenField(""); }}>Back to map</button>
        </Bezel>
      </Shell>
    );
  }

  if (step?.kind === "question" && step.item) {
    const item = step.item;
    const choices = orderedChoices(item.choices, item.id);
    const wordList = Array.isArray(item.words) ? item.words : [];
    const source = item.sourceId ? sourceCache[item.sourceId] : null;
    if (!choices.length) {
      return (
        <Shell {...shellProps}>
          <Bezel plate={current.title} aside="Question" scene={sceneFor(current.id)}>
            <h1 ref={headingRef} tabIndex={-1}>This question could not load.</h1>
            <p className="alert" role="alert">The answer choices are missing. Open another subject, or tell your parent or admin.</p>
            <button type="button" className="primary" onClick={() => { setSelected(""); setChosenField(""); }}>Back to map</button>
          </Bezel>
        </Shell>
      );
    }
    return (
      <Shell {...shellProps}>
        <Bezel plate={current.title} aside={`${step.index} of ${step.total}`} scene={sceneFor(current.id)}>
          <div className="meter" aria-hidden="true">
            <span style={{ width: `${((step.index - 1) / step.total) * 100}%` }} />
          </div>
          <h1 ref={headingRef} tabIndex={-1} className="prompt">{item.prompt}</h1>
          {wordList.length ? (
            <details className="study-panel">
              <summary>Words for this question</summary>
              <ul className="study-words">
                {wordList.map((word) => (
                  <li key={word.term}>
                    <strong>{word.term}</strong>
                    {" — "}
                    {word.meaning}
                    {word.example ? <span className="quiet"> Example: {word.example}</span> : null}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
          {item.sourceId ? (
            <details className="study-panel">
              <summary>{source?.title || "Helios essay"}</summary>
              {source?.body
                ? <pre className="study-source">{source.body}</pre>
                : <p className="quiet">Loading the source…</p>}
            </details>
          ) : null}
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
          <button type="button" className="text" onClick={() => { setSelected(""); setChosenField(""); }}>Back to map</button>
        </Bezel>
      </Shell>
    );
  }

  const level = current.learningLevel;
  const savedPace = pace[current.id];
  const paceValue = Number(paceDraft) || 3;

  return (
    <Shell {...shellProps}>
      <Bezel plate={current.title} aside="Finished" scene={sceneFor(current.id)}>
        <h1 ref={headingRef} tabIndex={-1}>{current.title} is finished</h1>
        <p>
          You answered {current.answered} of {current.total} questions.
          {current.moduleRoman ? ` (${current.moduleRoman})` : ""}
          {current.label ? ` ${current.label}.` : ""}
        </p>
        {level ? (
          <div className="learning-level" role="status">
            <h2>Rough year level for this set</h2>
            <p className="learning-level-headline">{level.headline}</p>
            <p className="learning-level-band">{level.nceaBand}</p>
            <p>{level.detail}</p>
            <p className="quiet">{level.disclaimer}</p>
          </div>
        ) : null}
        <div className="pace-feedback">
          <h2>How hard did this feel?</h2>
          <p className="quiet">
            Move the slider so the next sets can be made a bit easier or a bit harder for you.
          </p>
          <label className="pace-slider" htmlFor={`pace-${current.id}`}>
            <span className="pace-ends">
              <span>Too easy</span>
              <span className="pace-current">{paceLabels[paceValue] || "About right"}</span>
              <span>Too hard</span>
            </span>
            <input
              id={`pace-${current.id}`}
              type="range"
              min={1}
              max={5}
              step={1}
              value={paceValue}
              disabled={paceSaving}
              onChange={(event) => setPaceDraft(Number(event.target.value))}
            />
          </label>
          <button
            type="button"
            className="primary"
            disabled={paceSaving}
            onClick={() => onPaceSave(current.id, paceValue)}
          >
            {paceSaving ? "Saving…" : "Save how it felt"}
          </button>
          {savedPace?.label ? (
            <p className="quiet">Saved: {savedPace.label}</p>
          ) : null}
          {paceError ? <p className="alert" role="alert">{paceError}</p> : null}
        </div>
        {current.held ? (
          <div className="tech-weak-spots" role="status">
            <h2>What can open next</h2>
            <p>
              You got enough questions right first time that two new paths can open:
              a harder set in {current.title}, and a related subject nearby.
            </p>
            {(current.nextModules || []).filter((entry) => entry.awaiting).length ? (
              <ul>
                {(current.nextModules || []).filter((entry) => entry.awaiting).map((entry) => (
                  <li key={entry.strandId}>
                    <span className="tech-await-title">{entry.title}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <div className="tech-weak-spots" role="status">
            <h2>Ideas to strengthen</h2>
            {(current.missDetails || []).length ? (
              <ul>
                {(current.missDetails || []).map((miss) => (
                  <li key={miss.id}>
                    <span className="tech-await-title">{miss.prompt}</span>
                    <p className="quiet">
                      The short reading after that miss explains this idea before you write your own answer.
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="quiet">The ideas you missed stay at this level until a practice set covers them again.</p>
            )}
            <p>
              The next set in this subject stays at the same level until those ideas are stronger.
              Harder and wider paths open only after you get enough questions right first time.
            </p>
          </div>
        )}
        {current.awaitingModule ? (
          <div className="tech-await" role="status">
            <p>
              {current.held
                ? "You did well enough on this set. The next harder set, or a related subject, is not written yet."
                : `This set was not strong enough yet. Another practice set at the same level${current.nextModuleRoman ? ` (${current.nextModuleRoman})` : ""} is not written yet.`}
              {" "}
              Your parent or admin has been told and can see what to write next.
            </p>
            <p className="quiet">
              {current.held
                ? "If another related subject is already open on the map, you can study that. Otherwise mark an interest and come back later."
                : "Study other open subjects for now, or mark this one as an interest so it stays on your list."}
            </p>
          </div>
        ) : (
          <p>There are no more questions in this subject until a new set is added. You can update your interests below.</p>
        )}
        {interestPanel}
        <button type="button" className="text" onClick={() => setChosenField("")}>Back to map</button>
      </Bezel>
    </Shell>
  );
}

function Shell({ user, onAdmin, onHome, children }) {
  return (
    <main className="shell">
      <header className="top">
        {onHome ? (
          <button type="button" className="wordmark wordmark-home" onClick={onHome} title="Knowledge map">
            Sophia
          </button>
        ) : (
          <p className="wordmark">Sophia</p>
        )}
        <div className="top-actions">
          {onHome ? (
            <button type="button" className="top-home" onClick={onHome}>
              Knowledge map
            </button>
          ) : null}
          {onAdmin ? (
            <button type="button" className="text" onClick={onAdmin}>Admin report</button>
          ) : null}
          {user ? (
            <button type="button" className="text" onClick={() => signOut(auth)}>Sign out</button>
          ) : null}
        </div>
      </header>
      {children}
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
