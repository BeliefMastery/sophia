import { useEffect, useMemo, useState } from "react";
import { onValue, ref, set } from "firebase/database";
import { db, firebaseConfig } from "./firebase.js";
import { studentReport } from "../lib/report.mjs";
import { rewardFor } from "../lib/rewards.mjs";
import { reviewRecord } from "../lib/markRepair.mjs";
import { createStudentAccount } from "../lib/createStudent.mjs";
import {
  applyModules,
  chartMarks,
  expansionPrompt,
  fieldClusterPrompt,
  fieldMarks,
  fieldStudy,
  moduleOutcomes,
  modulePrompt,
  placementItems,
  sectionStatus,
} from "../lib/expansion.mjs";
import { tickedInterests } from "../content/interest-tree.mjs";
import { DepthChart, ExpansionPrompt, FieldCounts, InterestReport } from "./Depth.jsx";
import { Scene } from "./scenes.jsx";

function list(value) {
  if (!value) return [];
  return Object.entries(value).map(([id, record]) => ({ id, ...record }));
}

function when(stamp) {
  if (!stamp) return "No answers yet";
  return new Intl.DateTimeFormat("en-NZ", {
    timeZone: "Pacific/Auckland",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(stamp));
}

function groupMissesByField(fields) {
  return (fields || [])
    .filter((field) => (field.missDetails || []).length)
    .map((field) => ({
      id: field.id,
      title: field.title,
      held: field.held,
      complete: field.complete,
      matched: field.matched,
      total: field.total,
      need: field.need,
      misses: field.missDetails,
    }));
}

export function Admin({ user, onStudy }) {
  const [profiles, setProfiles] = useState(null);
  const [attempts, setAttempts] = useState(null);
  const [items, setItems] = useState(null);
  const [guides, setGuides] = useState(null);
  const [repairs, setRepairs] = useState(null);
  const [strands, setStrands] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [interests, setInterests] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [error, setError] = useState("");
  const [view, setView] = useState("students");
  const [selectedUid, setSelectedUid] = useState("");
  const [reviewSaving, setReviewSaving] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [createMessage, setCreateMessage] = useState("");
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    const watch = (path, setValue) => onValue(ref(db, path), (snapshot) => {
      setValue(snapshot.val() || {});
    }, (failure) => {
      setError(failure?.code === "PERMISSION_DENIED" ? "This login cannot read the report." : "The report did not load.");
    });
    const unsubs = [
      watch("profiles", setProfiles),
      watch("attempts", setAttempts),
      watch("items", setItems),
      watch("guides", setGuides),
      watch("repairs", setRepairs),
      watch("strands", setStrands),
      watch("catalog/interests", setCatalog),
      watch("interests", setInterests),
      watch("reviews", setReviews),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  const itemList = useMemo(() => list(items), [items]);
  const survey = useMemo(() => placementItems(itemList), [itemList]);

  async function onReviewOverride(uid, itemId, result) {
    if (!uid || !itemId || reviewSaving) return;
    setReviewSaving(`${uid}:${itemId}`);
    try {
      await set(ref(db, `reviews/${uid}/${itemId}`), reviewRecord(itemId, {
        result,
        note: `Parent marked ${result}.`,
        source: "parent",
      }, Date.now()));
    } catch {
      setError("That review was not saved. Try it again.");
    } finally {
      setReviewSaving("");
    }
  }

  async function onCreateStudent(event) {
    event.preventDefault();
    if (createBusy) return;
    setCreateBusy(true);
    setCreateError("");
    setCreateMessage("");
    try {
      const created = await createStudentAccount(firebaseConfig, {
        email: newEmail,
        password: newPassword,
        name: newName || newEmail.split("@")[0],
      });
      setCreateMessage(`Created ${created.name} (${created.email}). They can sign in now.`);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
    } catch (failure) {
      const code = failure?.code || "";
      if (code === "auth/email-already-in-use") setCreateError("That email already has an account.");
      else if (code === "auth/invalid-email") setCreateError("That email address is not valid.");
      else if (code === "auth/weak-password") setCreateError("Choose a stronger password (at least 6 characters).");
      else setCreateError(failure?.message || "That student account was not created.");
    } finally {
      setCreateBusy(false);
    }
  }

  const students = useMemo(() => {
    if (!profiles || !attempts || !items || !guides || !repairs || !strands || !catalog || !interests || !reviews) return null;
    const uids = new Set([...Object.keys(profiles), ...Object.keys(attempts), ...Object.keys(interests)]);
    return [...uids].map((uid) => {
      const self = uid === user.uid;
      const studentAttempts = list(attempts[uid]);
      const studentRepairs = repairs[uid] || {};
      const studentReviews = reviews[uid] || {};
      const report = studentReport(survey, studentAttempts, guides, studentRepairs);
      const fields = fieldStudy(strands, itemList, studentAttempts, studentRepairs);
      const deepen = fields.filter((field) => field.complete && field.held);
      const practice = fields.filter((field) => field.complete && !field.held);
      const missCount = fields.reduce((sum, field) => sum + (field.missed?.length || 0), 0);
      return {
        uid,
        self,
        reviews: studentReviews,
        name: self
          ? (profiles[uid]?.name ? `${profiles[uid].name} (admin practice)` : "Admin practice")
          : (profiles[uid]?.name || "Student"),
        attempts: studentAttempts,
        repairs: studentRepairs,
        interests: interests[uid] || {},
        report,
        fields,
        deepen,
        practice,
        missCount,
      };
    }).sort((a, b) => Number(b.self) - Number(a.self) || a.name.localeCompare(b.name));
  }, [profiles, attempts, items, guides, repairs, strands, catalog, interests, reviews, survey, itemList, user.uid]);

  if (error) {
    return (
      <section className="bezel">
        <div className="bezel-plate"><span>Admin</span><span>Report</span></div>
        <div className="bezel-screen"><p className="alert" role="alert">{error}</p></div>
      </section>
    );
  }

  if (!students) {
    return <p className="quiet">Loading the report…</p>;
  }

  const selected = students.find((student) => student.uid === selectedUid) || null;

  return (
    <div className="admin-shell">
      <section className="bezel">
        <div className="bezel-plate"><span>Admin</span><span>Home</span></div>
        <div className="bezel-screen">
          <Scene name="study" />
          <h1>Admin report</h1>
          <p>See where each student is struggling, then write the next module from the missed questions.</p>
          <div className="admin-nav">
            <button
              type="button"
              className={view === "students" && !selected ? "primary" : "text"}
              onClick={() => { setView("students"); setSelectedUid(""); }}
            >
              Students
            </button>
            <button
              type="button"
              className={view === "overall" ? "primary" : "text"}
              onClick={() => { setView("overall"); setSelectedUid(""); }}
            >
              Overall
            </button>
            {selected ? (
              <button type="button" className="primary" disabled>
                {selected.name}
              </button>
            ) : null}
          </div>
          {onStudy ? (
            <button type="button" className="text" onClick={onStudy}>Study as a student</button>
          ) : null}
          <form className="admin-create" onSubmit={onCreateStudent}>
            <h2>Add a student</h2>
            <p className="quiet">Creates a Firebase login. Share the email and initial password with the student.</p>
            <label>
              Display name
              <input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                maxLength={80}
                autoComplete="off"
                placeholder="Optional"
              />
            </label>
            <label>
              Email
              <input
                type="email"
                required
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                autoComplete="off"
              />
            </label>
            <label>
              Initial password
              <input
                type="text"
                required
                minLength={6}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
              />
            </label>
            <button type="submit" className="primary" disabled={createBusy}>
              {createBusy ? "Creating…" : "Create student login"}
            </button>
            {createMessage ? <p className="quiet">{createMessage}</p> : null}
            {createError ? <p className="alert" role="alert">{createError}</p> : null}
          </form>
        </div>
      </section>

      {view === "overall" ? (
        <OverallReport students={students} />
      ) : selected ? (
        <StudentPage
          student={selected}
          items={survey}
          strands={strands}
          allItems={itemList}
          catalog={catalog}
          onBack={() => setSelectedUid("")}
          onReviewOverride={onReviewOverride}
          reviewSaving={reviewSaving}
        />
      ) : (
        <StudentList students={students} onOpen={(uid) => setSelectedUid(uid)} />
      )}
    </div>
  );
}

function StudentList({ students, onOpen }) {
  if (!students.length) {
    return (
      <section className="bezel">
        <div className="bezel-plate"><span>Admin</span><span>Students</span></div>
        <div className="bezel-screen">
          <h1>No student activity yet.</h1>
          <p>Answers and interest ticks appear here after a student signs in, or after you practise in student mode.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bezel">
      <div className="bezel-plate"><span>Admin</span><span>Students</span></div>
      <div className="bezel-screen">
        <h1>Students</h1>
        <ul className="admin-roster">
          {students.map((student) => (
            <li key={student.uid}>
              <button type="button" className="admin-roster-row" onClick={() => onOpen(student.uid)}>
                <span className="admin-roster-name">{student.name}</span>
                <span className="admin-roster-meta">
                  {when(student.report.lastAt)}
                  {" · "}
                  {student.report.answered} answer{student.report.answered === 1 ? "" : "s"}
                  {" · "}
                  {student.missCount} miss{student.missCount === 1 ? "" : "es"}
                  {student.deepen.length ? ` · ${student.deepen.length} ready to deepen` : ""}
                  {student.practice.length ? ` · ${student.practice.length} need practice` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function OverallReport({ students }) {
  const totalAnswers = students.reduce((sum, student) => sum + student.report.answered, 0);
  const totalMisses = students.reduce((sum, student) => sum + student.missCount, 0);
  const byField = new Map();
  for (const student of students) {
    for (const field of student.fields) {
      const miss = field.missed?.length || 0;
      if (!miss) continue;
      const row = byField.get(field.id) || { id: field.id, title: field.title, misses: 0, students: 0 };
      row.misses += miss;
      row.students += 1;
      byField.set(field.id, row);
    }
  }
  const fields = [...byField.values()].sort((a, b) => b.misses - a.misses || a.title.localeCompare(b.title));

  return (
    <section className="bezel">
      <div className="bezel-plate"><span>Admin</span><span>Overall</span></div>
      <div className="bezel-screen">
        <h1>Overall</h1>
        <div className="stats">
          <p className="stat"><b>{students.length}</b><span>students</span></p>
          <p className="stat"><b>{totalAnswers}</b><span>answers</span></p>
          <p className="stat"><b>{totalMisses}</b><span>misses</span></p>
        </div>
        <h2>Misses by field</h2>
        {fields.length ? (
          <ul className="admin-field-counts">
            {fields.map((field) => (
              <li key={field.id}>
                <span>{field.title}</span>
                <span className="quiet">{field.misses} miss{field.misses === 1 ? "" : "es"} · {field.students} student{field.students === 1 ? "" : "s"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="quiet">No misses recorded yet.</p>
        )}
      </div>
    </section>
  );
}

function reviewLabel(result) {
  if (result === "known") return "Known";
  if (result === "partial") return "Partial";
  if (result === "unknown") return "Unknown";
  return "Unmarked";
}

function StudentPage({ student, items, strands, allItems, catalog, onBack, onReviewOverride, reviewSaving }) {
  const { report } = student;
  const status = sectionStatus(items, student.attempts, student.repairs, { id: "placement-check", ...strands["placement-check"] });
  const surveyMarks = fieldMarks(report.verdicts, items, student.attempts, student.repairs);
  const modules = moduleOutcomes(strands, allItems, student.attempts, student.repairs);
  const marks = chartMarks(applyModules(surveyMarks, modules), modules);
  const prompt = expansionPrompt({
    name: student.name,
    uid: student.uid,
    status,
    marks: surveyMarks,
  });
  const ticks = tickedInterests(student.interests, catalog);
  const missGroups = groupMissesByField(student.fields);
  const rewards = report.verdicts.map((verdict) => rewardFor(verdict)).filter(Boolean);
  const prompts = [
    ...student.practice.map((field) => ({
      key: `practice-${field.id}`,
      title: `${field.title} · same field`,
      text: fieldClusterPrompt({ name: student.name, uid: student.uid, field }),
    })),
    ...student.deepen.map((field) => ({
      key: `deepen-${field.id}`,
      title: `${field.title} · deepen`,
      text: fieldClusterPrompt({ name: student.name, uid: student.uid, field }),
    })),
    ...modules.filter((outcome) => outcome.complete).map((outcome) => ({
      key: `module-${outcome.strandId}`,
      title: outcome.title,
      text: modulePrompt({ name: student.name, uid: student.uid, outcome }),
    })),
    prompt ? { key: "survey", title: "Placement survey", text: prompt } : null,
  ].filter((entry) => entry && entry.text);

  return (
    <>
      <section className="bezel">
        <div className="bezel-plate"><span>Admin</span><span>{student.name}</span></div>
        <div className="bezel-screen">
          <button type="button" className="text" onClick={onBack}>Back to students</button>
          <h1>{student.name}</h1>
          <p className="quiet">Last answer: {when(report.lastAt)}</p>
          <div className="stats">
            <p className="stat"><b>{report.correct}</b><span>matched</span></p>
            <p className="stat"><b>{report.incorrect}</b><span>missed</span></p>
            <p className="stat"><b>{student.deepen.length}</b><span>ready to deepen</span></p>
            <p className="stat"><b>{student.practice.length}</b><span>need practice</span></p>
            <p className="stat"><b>{rewards.length}</b><span>achievements</span></p>
          </div>
          <FieldCounts fields={student.fields} />
          <DepthChart marks={marks} />
          <InterestReport ticks={ticks} />
        </div>
      </section>

      <section className="bezel">
        <div className="bezel-plate"><span>Misses</span><span>{student.missCount}</span></div>
        <div className="bezel-screen">
          <h2>Missed questions by field</h2>
          {missGroups.length ? missGroups.map((group) => (
            <details key={group.id} className="admin-miss-fold" open={missGroups.length === 1}>
              <summary>
                {group.title}
                <span className="quiet">
                  {" · "}
                  {group.matched} of {group.total} held
                  {group.complete ? (group.held ? " · deeper open" : " · needs practice") : ""}
                </span>
              </summary>
              <ul className="answer-list">
                {group.misses.map((row) => {
                  const review = student.reviews?.[row.id];
                  const saving = reviewSaving === `${student.uid}:${row.id}`;
                  return (
                    <li key={row.id}>
                      <p className="prompt-small">{row.prompt}</p>
                      <p>Chosen: {row.chosen}</p>
                      <p>Written answer: {row.repair}</p>
                      <p className={`review-chip is-${review?.result || "none"}`}>
                        {reviewLabel(review?.result)}
                        {review?.source ? ` · ${review.source}` : ""}
                        {review?.note ? ` · ${review.note}` : ""}
                      </p>
                      <div className="review-override">
                        {["known", "partial", "unknown"].map((result) => (
                          <button
                            key={result}
                            type="button"
                            className="text"
                            disabled={saving}
                            onClick={() => onReviewOverride(student.uid, row.id, result)}
                          >
                            {reviewLabel(result)}
                          </button>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </details>
          )) : (
            <p className="quiet">No misses yet.</p>
          )}
        </div>
      </section>

      <section className="bezel">
        <div className="bezel-plate"><span>Next module</span><span>{prompts.length}</span></div>
        <div className="bezel-screen">
          <h2>Cursor prompts</h2>
          {prompts.length ? (
            <details className="admin-miss-fold">
              <summary>Copy prompts for the next modules</summary>
              {prompts.map((entry) => (
                <ExpansionPrompt key={entry.key} prompt={entry.text} pending="" />
              ))}
            </details>
          ) : (
            <p className="quiet">A prompt appears when a field or module sitting is finished.</p>
          )}
        </div>
      </section>
    </>
  );
}
