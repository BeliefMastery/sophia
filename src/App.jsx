import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { orderedChoices } from "../lib/records.mjs";
import { auth, firebaseConfig, useEmulators } from "./firebase.js";
import { passageParagraphs } from "../lib/explain.mjs";
import { paceLabels } from "../lib/expansion.mjs";
import { Admin } from "./Admin.jsx";
import { InterestVote } from "./InterestVote.jsx";
import { KnowledgeTree } from "./KnowledgeTree.jsx";
import { NceaRoadmap } from "./NceaRoadmap.jsx";
import { Scene, sceneFor } from "./scenes.jsx";
import { useLearningStore } from "./useLearningStore.js";

const signInMessages = {
  "auth/invalid-credential": "That email or password did not match.",
  "auth/invalid-login-credentials": "That email or password did not match.",
  "auth/wrong-password": "That email or password did not match.",
  "auth/user-not-found": "That email or password did not match.",
  "auth/operation-not-allowed": "Email sign-in is not turned on for this project yet.",
  "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
};

export function App() {
  const [user, setUser] = useState(undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signInError, setSignInError] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [selected, setSelected] = useState("");
  const [repairDraft, setRepairDraft] = useState("");
  const [whyDraft, setWhyDraft] = useState("");
  const [paceDraft, setPaceDraft] = useState(3);
  const [writtenDraft, setWrittenDraft] = useState("");
  const [dashboardView, setDashboardView] = useState("map");
  const [studyMode, setStudyMode] = useState(() => {
    try {
      return sessionStorage.getItem("sophia-study-mode") === "1";
    } catch {
      return false;
    }
  });
  const headingRef = useRef(null);

  const store = useLearningStore(user);
  const {
    ready,
    library,
    strands,
    parent,
    guides,
    catalog,
    entranceCatalog,
    tree,
    interests,
    entrance,
    pace,
    sourceCache,
    fields,
    step,
    activeRepair,
    chosenField,
    setChosenField,
    setPendingRepair,
    confirmedMatch,
    setConfirmedMatch,
    primerDismissed,
    dismissPrimer,
    saving,
    recordError,
    setRecordError,
    interestSaving,
    interestError,
    entranceSaving,
    entranceError,
    paceSaving,
    paceError,
    submitChoice,
    submitWritten,
    submitRepair,
    saveInterests,
    saveEntrance,
    savePace,
  } = store;

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
    if (user) return;
    setRepairDraft("");
    setPaceDraft(3);
    setStudyMode(false);
    setDashboardView("map");
  }, [user]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [user, chosenField, step?.item?.id, step?.kind, activeRepair?.item?.id]);

  useEffect(() => {
    if (!chosenField || !pace) return;
    const saved = Number(pace[chosenField]?.rating);
    setPaceDraft(saved >= 1 && saved <= 5 ? saved : 3);
  }, [chosenField, pace]);

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
    if (await submitWritten(item, writtenDraft)) {
      setWrittenDraft("");
    }
  }

  async function onRecord() {
    const item = step?.kind === "question" ? step.item : null;
    if (!item || !selected) return;
    setRepairDraft("");
    if (await submitChoice(item, selected)) {
      setSelected("");
    }
  }

  async function onRepair() {
    if (await submitRepair(repairDraft)) {
      setRepairDraft("");
    }
  }

  const onInterestSave = saveInterests;
  const onEntranceSave = saveEntrance;
  const onPaceSave = savePace;

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

  if (!ready) {
    return <Shell user={user}><p className="quiet">Loading your map…</p></Shell>;
  }

  function goHome() {
    setSelected("");
    setWrittenDraft("");
    setRecordError("");
    setChosenField("");
    setConfirmedMatch(null);
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
        <Bezel
          plate={dashboardView === "roadmap" ? "Pathway" : "Knowledge map"}
          aside={dashboardView === "roadmap" ? "NCEA & UE" : "Entrance"}
          scene="study"
        >
          <div className="view-toggle-bar">
            <button
              type="button"
              className={`view-toggle-btn ${dashboardView === "map" ? "is-active" : ""}`}
              onClick={() => setDashboardView("map")}
            >
              Knowledge Map (Study)
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${dashboardView === "roadmap" ? "is-active" : ""}`}
              onClick={() => setDashboardView("roadmap")}
            >
              NCEA & University Roadmap
            </button>
          </div>

          {dashboardView === "roadmap" ? (
            <NceaRoadmap
              fields={fields}
              onStudy={(fieldId) => {
                setSelected("");
                setWrittenDraft("");
                setPendingRepair(null);
                setConfirmedMatch(null);
                setChosenField(fieldId);
              }}
            />
          ) : (
            <>
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
                  setConfirmedMatch(null);
                  setChosenField(fieldId);
                }}
                onSaveInterests={onInterestSave}
                onSaveEntrance={onEntranceSave}
                savingInterest={interestSaving}
                savingEntrance={entranceSaving}
                interestError={interestError}
                entranceError={entranceError}
              />
            </>
          )}
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

  if (confirmedMatch) {
    const item = confirmedMatch.item;
    const wordList = Array.isArray(item.words) ? item.words : [];
    return (
      <Shell {...shellProps}>
        <Bezel plate={current?.title || "Concept Confirmed"} aside="Mastered" tone="good" scene={current?.id ? sceneFor(current.id) : "study"}>
          <div className="learning-confirmation" role="status">
            <span className="confirmation-badge">✓ Concept Understood</span>
            <h1 ref={headingRef} tabIndex={-1} className="prompt">{item.prompt}</h1>
            <p className="confirmed-choice">
              <b>Your answer:</b> {confirmedMatch.choiceText}
            </p>
            <div className="learning-takeaway">
              <h3>Key Learning</h3>
              <p>
                You demonstrated the core principle for this question. Every verified concept strengthens the foundation needed for NCEA achievement standards and University Entrance.
              </p>
            </div>
            {wordList.length ? (
              <div className="confirmed-words">
                <h4>Key vocabulary for this concept:</h4>
                <ul>
                  {wordList.map((word) => (
                    <li key={word.term}>
                      <strong>{word.term}</strong>: {word.meaning}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <label>
              In one sentence, why is this answer right?
              <textarea
                value={whyDraft}
                onChange={(event) => setWhyDraft(event.target.value)}
                placeholder="Explain the idea in your own words to lock it in…"
                maxLength={500}
                rows={2}
              />
            </label>
            <button
              type="button"
              className="primary"
              disabled={whyDraft.trim().length < 12}
              onClick={() => {
                setWhyDraft("");
                setConfirmedMatch(null);
              }}
            >
              Continue to next question →
            </button>
            <button type="button" className="text" onClick={() => { setWhyDraft(""); goHome(); }}>Back to map</button>
          </div>
        </Bezel>
      </Shell>
    );
  }

  if (step?.item && step.index === 1 && !primerDismissed[current.id]) {
    const strand = strands?.[step.item.strandId] || {};
    return (
      <Shell {...shellProps}>
        <Bezel plate={current.title} aside="Concept Primer" scene={sceneFor(current.id)}>
          <div className="learning-confirmation" role="region" aria-label="Concept Primer">
            <span className="confirmation-badge">Module Overview</span>
            <h1 ref={headingRef} tabIndex={-1}>{strand.title || current.title}</h1>
            <p>{strand.summary || `You are starting a ${step.total}-question set in ${current.title}.`}</p>
            <div className="learning-takeaway">
              <h3>What to keep in mind</h3>
              <p>
                Take your time with each question. If you get one right, you will see a quick concept summary.
                If you miss one, you will get a short reading to build the idea before moving on.
              </p>
            </div>
            <button
              type="button"
              className="primary"
              onClick={() => dismissPrimer(current.id)}
            >
              Start module ({step.total} questions) →
            </button>
            <button type="button" className="text" onClick={goHome}>Back to map</button>
          </div>
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
        <div className="finished-diagnostics">
          <div className="finished-card mastery-card">
            <h3>✓ Concepts Mastered in This Sitting</h3>
            <p>
              You achieved <b>{current.matched} of {current.total}</b> questions right on your first attempt.
              {current.held
                ? " You demonstrated solid understanding across the core concepts tested here."
                : " Every question you answered correctly reinforces essential baseline knowledge for your senior pathway."}
            </p>
          </div>

          <div className="finished-card frontier-card">
            <h3>🎯 Where You Are Limited (Your Learning Frontier)</h3>
            {(current.missDetails || []).length ? (
              <>
                <p>The following ideas were unfamiliar or need strengthening before advancing to higher NCEA standards:</p>
                <ul>
                  {(current.missDetails || []).map((miss) => (
                    <li key={miss.id} className="finished-miss-item">
                      <b>Concept:</b> {miss.prompt}
                      {miss.chosen ? <div className="quiet">Initial choice: {miss.chosen}</div> : null}
                      {miss.repair ? <div><b>Your repair answer:</b> {miss.repair}</div> : null}
                    </li>
                  ))}
                </ul>
                <p className="quiet">
                  Completing the short reading and written repair helps eliminate this limitation. Another practice set at this level will solidify these concepts.
                </p>
              </>
            ) : (
              <p>
                No limitations detected in this sitting! All tested concepts held at this tier. You are ready for deeper or broader material.
              </p>
            )}
          </div>

          <div className="finished-card pathway-card">
            <h3>🎓 NCEA & University Entrance Impact</h3>
            <p>
              This module builds toward <b>{level?.nceaBand || "NCEA Foundation"}</b>.
              Mastery here feeds directly into your University Entrance requirements (Co-requisite or Approved Subject credit readiness).
            </p>
            <button
              type="button"
              className="frontier-btn"
              onClick={() => {
                setChosenField("");
                setDashboardView("roadmap");
              }}
            >
              View your NCEA & University Roadmap →
            </button>
          </div>
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
                ? "You did well enough on this set. The next harder set, or a related subject, is queued to be prepared."
                : `This set was not strong enough yet. Another practice set at the same level${current.nextModuleRoman ? ` (${current.nextModuleRoman})` : ""} is queued.`}
              {" "}
              Your parent or admin has been notified.
            </p>
            <p className="quiet">
              You don't have to wait! Explore other open subjects on the Knowledge Map, or check your NCEA Roadmap above.
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
