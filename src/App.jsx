import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { get, onValue, push, ref, set } from "firebase/database";
import { recordChoice } from "../lib/recordChoice.mjs";
import { orderedChoices } from "../lib/records.mjs";
import { auth, db, firebaseConfig, useEmulators } from "./firebase.js";
import { passageParagraphs } from "../lib/explain.mjs";
import { fieldPlace, fieldStudy, nextFieldStep } from "../lib/expansion.mjs";
import { Admin } from "./Admin.jsx";
import { InterestVote } from "./InterestVote.jsx";
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
  const [interests, setInterests] = useState(null);
  const [interestSaving, setInterestSaving] = useState(false);
  const [interestError, setInterestError] = useState("");
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
    const unsubInterests = onValue(ref(db, `interests/${user.uid}`), (snapshot) => {
      setInterests(snapshot.val() || {});
    });
    return () => {
      unsubItems();
      unsubStrands();
      unsubAttempts();
      unsubRole();
      unsubRepairs();
      unsubCatalog();
      unsubInterests();
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
    setInterests(null);
    setInterestError("");
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
  const pendingHere = pendingRepair
    && fieldPlace(strands || {}, library || [], pendingRepair.item).id === chosenField
    && !(typeof repairs?.[pendingRepair.item.id]?.answer === "string" && repairs[pendingRepair.item.id].answer.trim());
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
          <h1 ref={headingRef} tabIndex={-1}>Sophia</h1>
          <p>Sign in with the account made for you. Then choose a field to study.</p>
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

  if (parent && !studyMode) {
    return (
      <Shell user={user}>
        <Admin user={user} onStudy={() => setStudyMode(true)} />
      </Shell>
    );
  }

  if (!library || !strands || !attempts || repairs === null || parent === null || catalog === null || interests === null) {
    return <Shell user={user}><p className="quiet">Loading the check…</p></Shell>;
  }

  const shellProps = {
    user,
    onAdmin: parent ? () => { setChosenField(""); setStudyMode(false); } : null,
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
          <h1 ref={headingRef} tabIndex={-1}>The questions are not loaded.</h1>
          <p>There is no field to open yet.</p>
        </Bezel>
      </Shell>
    );
  }

  const current = fields.find((field) => field.id === chosenField);
  if (!current) {
    return (
      <Shell {...shellProps}>
        <Bezel plate="Fields" aside="Choose one" scene="study">
          <h1 ref={headingRef} tabIndex={-1}>Choose a field</h1>
          <p>Work in one field at a time. Your place in each field is saved. Fields with no answers yet stay visible as not started.</p>
          {parent ? <p className="quiet">You are in student mode. Answers are saved on this admin login so you can review them in the report.</p> : null}
          <ul className="domains">
            {fields.map((field) => (
              <li key={field.id}>
                <button type="button" className="domain" onClick={() => { setSelected(""); setChosenField(field.id); }}>
                  <span className="domain-title">{field.title}</span>
                  <span className="domain-meta">
                    {field.depth ? `Depth ${field.depth}. ` : ""}
                    {field.complete ? "Section finished" : field.label}
                    {!field.answered ? " · Not started" : ""}
                  </span>
                  <span className="domain-count">{field.answered} of {field.total}</span>
                  <span className="meter" aria-hidden="true">
                    <span style={{ width: `${field.total ? (field.answered / field.total) * 100 : 0}%` }} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {interestPanel}
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
          <p>That choice did not match. The choices are closed.</p>
          {chosen ? <p className="quiet">Your choice: {chosen}</p> : null}
          {!follow || paragraphs.length < 2 ? <p className="quiet">Loading the reading…</p> : (
            <>
              <p>Read the passages below, then answer the new question from that reading only.</p>
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
          <button type="button" className="text" onClick={() => setChosenField("")}>All fields</button>
        </Bezel>
      </Shell>
    );
  }

  if (step?.kind === "question" && step.item) {
    const item = step.item;
    const choices = orderedChoices(item.choices);
    return (
      <Shell {...shellProps}>
        <Bezel plate={current.title} aside={`${step.index} of ${step.total}`} scene={sceneFor(current.id)}>
          <div className="meter" aria-hidden="true">
            <span style={{ width: `${((step.index - 1) / step.total) * 100}%` }} />
          </div>
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
          <button type="button" className="text" onClick={() => { setSelected(""); setChosenField(""); }}>All fields</button>
        </Bezel>
      </Shell>
    );
  }

  return (
    <Shell {...shellProps}>
      <Bezel plate={current.title} aside="Section finished" scene={sceneFor(current.id)}>
        <h1 ref={headingRef} tabIndex={-1}>{current.title} is finished</h1>
        <p>
          {current.answered} of {current.total} questions are answered.
          {current.depth ? ` Depth ${current.depth}. ${current.label}.` : ""}
        </p>
        <p>There is no further question in this field until a new cluster is added. You can update your interest ticks below.</p>
        {interestPanel}
        <button type="button" className="primary" onClick={() => setChosenField("")}>All fields</button>
      </Bezel>
    </Shell>
  );
}

function Shell({ user, onAdmin, children }) {
  return (
    <main className="shell">
      <header className="top">
        <p className="wordmark">Sophia</p>
        <div className="top-actions">
          {onAdmin ? (
            <button type="button" className="text" onClick={onAdmin}>Admin report</button>
          ) : null}
          {user ? (
            <button type="button" className="text" onClick={() => signOut(auth)}>Sign out</button>
          ) : null}
        </div>
      </header>
      {children}
      <footer className="files">
        <a href="https://github.com/BeliefMastery/sophia">Project files on GitHub</a>
        <a href="https://github.com/BeliefMastery/sophia/archive/refs/heads/main.zip">Download this copy</a>
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
