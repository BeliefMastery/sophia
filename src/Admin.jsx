import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "./firebase.js";
import { studentReport } from "../lib/report.mjs";
import { rewardFor } from "../lib/rewards.mjs";
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
import { Reward } from "./Reward.jsx";
import { DepthChart, ExpansionPrompt, FieldCounts, InterestReport } from "./Depth.jsx";
import { Scene, sceneFor } from "./scenes.jsx";

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

export function Admin({ user, onStudy }) {
  const [profiles, setProfiles] = useState(null);
  const [attempts, setAttempts] = useState(null);
  const [items, setItems] = useState(null);
  const [guides, setGuides] = useState(null);
  const [repairs, setRepairs] = useState(null);
  const [strands, setStrands] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [interests, setInterests] = useState(null);
  const [error, setError] = useState("");

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
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  if (error) {
    return (
      <section className="bezel">
        <div className="bezel-plate"><span>Admin</span><span>Report</span></div>
        <div className="bezel-screen"><p className="alert" role="alert">{error}</p></div>
      </section>
    );
  }

  if (!profiles || !attempts || !items || !guides || !repairs || !strands || !catalog || !interests) {
    return <p className="quiet">Loading the report…</p>;
  }

  const itemList = list(items);
  const survey = placementItems(itemList);
  const uids = new Set([...Object.keys(profiles), ...Object.keys(attempts), ...Object.keys(interests)]);
  const students = [...uids].map((uid) => {
    const self = uid === user.uid;
    return {
      uid,
      self,
      name: self
        ? (profiles[uid]?.name ? `${profiles[uid].name} (admin practice)` : "Admin practice")
        : (profiles[uid]?.name || "Student"),
      attempts: list(attempts[uid]),
      repairs: repairs[uid] || {},
      interests: interests[uid] || {},
      report: studentReport(survey, list(attempts[uid]), guides, repairs[uid]),
    };
  }).sort((a, b) => Number(b.self) - Number(a.self) || a.name.localeCompare(b.name));

  const home = (
    <section className="bezel">
      <div className="bezel-plate"><span>Admin</span><span>Home</span></div>
      <div className="bezel-screen">
        <Scene name="study" />
        <h1>Admin report</h1>
        <p>Review student progress here, or switch to student mode to take the modules yourself. Your practice answers stay on this login and show in the report below.</p>
        {onStudy ? (
          <button type="button" className="primary" onClick={onStudy}>Study as a student</button>
        ) : null}
      </div>
    </section>
  );

  if (!students.length) {
    return (
      <>
        {home}
        <section className="bezel">
          <div className="bezel-plate"><span>Admin</span><span>Report</span></div>
          <div className="bezel-screen">
            <h1>No student activity yet.</h1>
            <p>Answers and interest ticks appear here after a student signs in, or after you practise in student mode.</p>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {home}
      {students.map((student) => (
        <StudentReport
          key={student.uid}
          student={student}
          items={survey}
          strands={strands}
          allItems={itemList}
          catalog={catalog}
        />
      ))}
    </>
  );
}

function StudentReport({ student, items, strands, allItems, catalog }) {
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
  const fields = fieldStudy(strands, allItems, student.attempts, student.repairs);
  const ready = fields.filter((field) => field.complete);
  const ticks = tickedInterests(student.interests, catalog);
  const validated = report.verdicts.filter((verdict) => verdict.open === false && verdict.validated).length;
  const invalidated = report.verdicts.filter((verdict) => verdict.open === false && !verdict.validated).length;
  const open = report.verdicts.filter((verdict) => verdict.open).length;
  const rewards = report.verdicts.map((verdict) => rewardFor(verdict)).filter(Boolean);
  const excellent = rewards.filter((reward) => reward.level === "excellent").length;
  const achieved = rewards.filter((reward) => reward.level === "achievement").length;

  return (
    <>
      <section className="bezel">
        <div className="bezel-plate"><span>Admin</span><span>{student.name}</span></div>
        <div className="bezel-screen">
          <Scene name="study" />
          <h1>{student.name}</h1>
          <p className="quiet">Last answer: {when(report.lastAt)}</p>
          <div className="stats">
            <p className="stat"><b>{report.correct}</b><span>matched the key</span></p>
            <p className="stat"><b>{report.incorrect}</b><span>did not match</span></p>
            <p className="stat"><b>{validated}</b><span>notes validated</span></p>
            <p className="stat"><b>{invalidated}</b><span>notes invalidated</span></p>
            <p className="stat"><b>{open}</b><span>notes still open</span></p>
            <p className="stat"><b>{excellent}</b><span>excellent achievements</span></p>
            <p className="stat"><b>{achieved}</b><span>achievements</span></p>
          </div>
        </div>
      </section>
      <section className="bezel">
        <div className="bezel-plate"><span>Depth</span><span>Age tiers</span></div>
        <div className="bezel-screen">
          <Scene name="reward" />
          <h2>How far each field goes</h2>
          <FieldCounts fields={fields} />
          <DepthChart marks={marks} />
          <InterestReport ticks={ticks} />
        </div>
      </section>
      <section className="bezel">
        <div className="bezel-plate"><span>Next cluster</span><span>{ready.length ? "Ready" : "Open"}</span></div>
        <div className="bezel-screen">
          <h2>Fields ready for more questions</h2>
          {ready.length ? ready.map((field) => (
            <ExpansionPrompt
              key={field.id}
              prompt={fieldClusterPrompt({ name: student.name, uid: student.uid, field })}
              pending=""
            />
          )) : (
            <p>A prompt appears when a student finishes every current question in a field. Interest ticks are a register only; they do not choose the next module.</p>
          )}
          {prompt ? <ExpansionPrompt prompt={prompt} pending="" /> : null}
        </div>
      </section>
      {modules.filter((outcome) => outcome.complete).map((outcome) => (
        <section key={outcome.strandId} className="bezel">
          <div className="bezel-plate"><span>Next module</span><span>{outcome.title}</span></div>
          <div className="bezel-screen">
            <ExpansionPrompt
              prompt={modulePrompt({ name: student.name, uid: student.uid, outcome })}
              pending=""
            />
          </div>
        </section>
      ))}
      {report.verdicts.map((verdict) => {
        const mark = marks.find((entry) => entry.claimId === verdict.claimId);
        const field = fields.find((entry) => entry.id === verdict.claimId);
        const reward = rewardFor(verdict);
        const plate = verdict.open ? "Open" : reward ? reward.title : verdict.validated ? "Validated" : "Invalidated";
        const tone = verdict.open ? "" : reward ? reward.level : verdict.validated ? "validated" : "invalidated";
        return (
        <section key={verdict.claimId} className={tone ? `bezel is-${tone}` : "bezel"}>
          <div className="bezel-plate">
            <span>{plate}</span>
            <span>{verdict.title}</span>
          </div>
          <div className="bezel-screen">
            <Scene name={sceneFor(verdict.claimId)} />
            <Reward verdict={verdict} />
            {mark ? <p className="quiet">Depth {mark.depth}. {mark.label}. The peer line is Year 10, age 15.</p> : null}
            <p className="note">Note: {verdict.assessment}</p>
            {field ? <p className="quiet">{field.answered} of {field.total} questions in this field.</p> : null}
            {verdict.open ? null : <h2>{verdict.text}</h2>}
          </div>
        </section>
        );
      })}
      <section className="bezel">
        <div className="bezel-plate"><span>Activity</span><span>{report.activity.length}</span></div>
        <div className="bezel-screen">
          {report.activity.length ? (
            <ul className="answer-list">
              {report.activity.map((row) => (
                <li key={row.id || `${row.itemId}-${row.submittedAt}`}>
                  <p className="quiet">{when(row.submittedAt)} · {row.counted ? "Counts" : "Later answer"}</p>
                  <p className="prompt-small">{row.prompt}</p>
                  <p>Chosen: {row.chosen || "No choice recorded"}</p>
                  <p>{row.matched ? "Matched the key." : "Did not match the key."}</p>
                  {row.matched ? null : (
                    <>
                      <p>Written answer: {row.repair || "Not written yet."}</p>
                      <p>Key: {row.answerText}</p>
                      {row.explanation.map((line) => <p key={line}>{line}</p>)}
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : <p>No answers yet.</p>}
        </div>
      </section>
    </>
  );
}
