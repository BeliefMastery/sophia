import { claims } from "./claims.mjs";
import { yearPlace } from "./rewards.mjs";
import { firstAttemptByItem, repairAnswer } from "./records.mjs";

const ageTiers = [
  { id: "year9", label: "Year 9", age: 14, at: 0 },
  { id: "year10", label: "Year 10", age: 15, at: 25 },
  { id: "year11", label: "Year 11", age: 16, at: 50 },
  { id: "year12", label: "Year 12", age: 17, at: 75 },
  { id: "year13", label: "Year 13", age: 18, at: 100 },
];

const peerAt = 25;

/** First-attempt matches needed for a sitting to hold (ceil(5n/6)). */
function heldMatchesNeeded(total) {
  const n = Number(total) || 0;
  if (n <= 0) return 0;
  return Math.ceil((5 * n) / 6);
}

/** Module labels use Roman numerals (Module I, Module II, …). */
function toRoman(value) {
  let n = Math.floor(Number(value) || 0);
  if (n <= 0) return "";
  if (n >= 4000) return String(n);
  const table = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  for (const [amount, glyph] of table) {
    while (n >= amount) {
      out += glyph;
      n -= amount;
    }
  }
  return out;
}

function moduleLabel(depth) {
  const roman = toRoman(depth);
  return roman ? `Module ${roman}` : "";
}

/** Target question count per domain module (supports 5-of-6 hold). */
const MODULE_QUESTION_MIN = 5;
const MODULE_QUESTION_MAX = 8;
const MODULE_QUESTION_TARGET = 6;

function sectionHeld(matched, total) {
  const n = Number(total) || 0;
  return n > 0 && (Number(matched) || 0) >= heldMatchesNeeded(n);
}

function missDetailsFor(items, attempts, repairs, missedIds) {
  const first = firstAttemptByItem(attempts || []);
  const byId = new Map((items || []).map((item) => [item.id, item]));
  return (missedIds || []).map((id) => {
    const item = byId.get(id);
    const attempt = first.get(id);
    return {
      id,
      prompt: item?.prompt || id,
      chosen: item?.choices?.[attempt?.selected]?.text || "No choice recorded",
      repair: repairAnswer(repairs, id) || "Not written yet.",
    };
  });
}

function missDetailLines(details) {
  if (!(details || []).length) return ["Missed questions: none"];
  return [
    "Missed questions:",
    ...details.map((row) => [
      `- ${row.id}: ${row.prompt}`,
      `  Chosen: ${row.chosen}`,
      `  Written: ${row.repair}`,
    ].join("\n")),
  ];
}

const reservedStrand = {
  mathematics: "mathematics-hold",
  english: "english-year10",
  physics: "science-physics",
  chemistry: "science-chemistry",
  biology: "science-biology",
  geology: "science-earth",
  history: "decision-context",
  politics: "decision-context",
  technology: "decision-context",
  psychology: "psychology-insight",
  socialManagement: "social-management",
};

function placementItems(items) {
  return (items || []).filter((item) => !item.strandId || item.strandId === "placement-check");
}

function nextStrandId(claimId, mode) {
  if (mode === "deeper") {
    if (claimId === "psychology") return "psychology-insight";
    if (claimId === "socialManagement") return "social-management-depth-2";
    if (claimId === "history" || claimId === "politics" || claimId === "technology") return "decision-context-depth-2";
    return `${claimId}-depth-2`;
  }
  return reservedStrand[claimId] || `${claimId}-depth-2`;
}

function placeVerdict(verdict) {
  const place = yearPlace[verdict.claimId];
  const direction = verdict.direction;
  if (!place || direction === "mixed") {
    return {
      position: null,
      unsettled: true,
      label: "Does not sit cleanly against the note",
      mode: "same",
      recommendation: "The answers do not sit cleanly against the note. Write the next module at the same difficulty.",
    };
  }
  if (direction === "behind") {
    if (place === "above") {
      return {
        position: peerAt,
        label: "On the Year 10 line",
        mode: "same",
        recommendation: "The advanced note did not hold. Keep the next module at Year 10 difficulty. Do not write a deeper dive.",
      };
    }
    const below = {
      year: [14, "Below the Year 10 note"],
      halfway: [10, "Below the halfway Year 10 note"],
      partial: [12, "Below the chemistry note"],
      below: [8, "Below the Year 10 line"],
    }[place];
    return {
      position: below[0],
      label: below[1],
      mode: "same",
      recommendation: "The note did not hold. Write the next module at the same difficulty. Do not go deeper.",
    };
  }
  if (direction === "ahead" && place === "below") {
    return {
      position: 16,
      label: "Toward the Year 10 line",
      mode: "same",
      recommendation: "The answers are stronger than a below-year note. They do not show the subject is above Year 10. Write the next module toward the Year 10 line, still at age 15, one step further into the field.",
    };
  }
  if (direction === "ahead" && (place === "halfway" || place === "partial")) {
    return {
      position: 22,
      label: place === "halfway" ? "Inside Year 10, past the halfway note" : "Inside Year 10, past the note",
      mode: "same",
      recommendation: "The answers go past the October note and stay inside Year 10. Write the next module to finish the Year 10 work. Do not write a Year 11 dive.",
    };
  }
  if (direction === "ahead" && place === "above") {
    return {
      position: 48,
      label: "Further above Year 10",
      mode: "deeper",
      recommendation: "The answers are stronger than the advanced note. Write a deeper dive above Year 10. Do not call the result Year 13 or NCEA.",
    };
  }
  if (place === "below") {
    return {
      position: 8,
      label: "Below the Year 10 line",
      mode: "same",
      recommendation: "The weak note held. She is below the Year 10 line for age 15. Write the next module at the same foundation difficulty. Do not write a deeper dive.",
    };
  }
  if (place === "halfway" || place === "partial") {
    return {
      position: place === "halfway" ? 16 : 18,
      label: place === "halfway" ? "Halfway through Year 10" : "Part of Year 10",
      mode: "either",
      recommendation: "The note held at the expected place inside Year 10. The next module can be more practice at this difficulty, or one step deeper if a deeper dive is requested. This result is not above Year 10.",
    };
  }
  if (place === "year") {
    return {
      position: peerAt,
      label: "Year 10",
      mode: "either",
      recommendation: "The note held at the Year 10 level expected at age 15. The next module can be more practice at this difficulty, or one step deeper if a deeper dive is requested.",
    };
  }
  return {
    position: 42,
    label: "Above Year 10",
    mode: "deeper",
    recommendation: "The advanced note holds above the usual Year 10 level for age 15. Write the next module as a deeper dive at Year 11, age 16. Do not call it Year 12, Year 13, or NCEA.",
  };
}

function withStrand(verdict, placed) {
  const strandId = nextStrandId(verdict.claimId, placed.mode);
  return {
    ...placed,
    nextStrandId: strandId,
    recommendation: `${placed.recommendation} Next strand id: ${strandId}.`,
  };
}

function claimReady(items, attempts, repairs, claimId) {
  const group = (items || []).filter((item) => item.claim === claimId);
  if (!group.length) return false;
  const first = firstAttemptByItem(attempts || []);
  return group.every((item) => {
    const attempt = first.get(item.id);
    if (!attempt) return false;
    return attempt.matched === true || Boolean(repairAnswer(repairs, item.id));
  });
}

function emptyMark(claim, label) {
  return {
    claimId: claim.id || claim.claimId,
    title: claim.title,
    peer: peerAt,
    depth: 0,
    position: null,
    label,
    mode: null,
    nextStrandId: "",
    recommendation: "",
    unsettled: false,
  };
}

function markVerdict(verdict, ready) {
  if (verdict.open || !ready) return emptyMark(verdict, verdict.open ? "Not finished" : "Written answer still due");
  const placed = withStrand(verdict, placeVerdict(verdict));
  return {
    claimId: verdict.claimId,
    title: verdict.title,
    peer: peerAt,
    depth: 1,
    unsettled: Boolean(placed.unsettled),
    ...placed,
  };
}

function fieldMarks(verdicts, items, attempts, repairs) {
  const survey = placementItems(items);
  const byId = new Map((verdicts || []).map((verdict) => [verdict.claimId, verdict]));
  const present = new Set(survey.map((item) => item.claim));
  return claims.filter((claim) => present.has(claim.id)).map((claim) => {
    const verdict = byId.get(claim.id);
    if (!verdict) return emptyMark(claim, "Not finished");
    return markVerdict(verdict, claimReady(survey, attempts, repairs, claim.id));
  });
}

function sectionStatus(items, attempts, repairs, strand) {
  const ordered = [...placementItems(items)].sort((a, b) => a.order - b.order);
  const first = firstAttemptByItem(attempts || []);
  let answered = 0;
  let repairsDue = 0;
  const missed = [];
  for (const item of ordered) {
    const attempt = first.get(item.id);
    if (!attempt) continue;
    answered += 1;
    if (attempt.matched !== true) {
      missed.push(item.id);
      if (!repairAnswer(repairs, item.id)) repairsDue += 1;
    }
  }
  const strandId = strand?.id || ordered[0]?.strandId || "placement-check";
  return {
    strandId,
    title: strand?.title || (strandId === "placement-check" ? "Placement check" : strandId),
    depth: Number(strand?.depth) || 1,
    role: strand?.role || (strandId === "placement-check" ? "survey" : "module"),
    total: ordered.length,
    answered,
    repairsDue,
    missed,
    complete: ordered.length > 0 && answered === ordered.length && repairsDue === 0,
  };
}

function expansionPrompt({ name, uid, status, marks }) {
  if (!status?.complete) return "";
  const psych = (marks || []).find((mark) => mark.claimId === "psychology");
  const interest = psych?.mode === "deeper"
    ? "Psychology is above the Year 10 line on this check, so a deeper psychology module is a compelling extension when that topic is named."
    : "Psychology is not above the Year 10 line on this check, so a psychology extension stays at the difficulty named for that field.";
  const kind = status.role === "module" ? "module" : "survey";
  const fieldLines = (marks || []).map((mark) => (
    `- ${mark.title} (${mark.claimId}): ${mark.label}. Depth ${mark.depth}. ${mark.recommendation}`
  ));
  return [
    `Section complete: ${status.strandId}, ${status.title}, depth ${status.depth} ${kind}.`,
    `${name} finished every question in this section, and every miss has a written repair. This does not award NCEA.`,
    "",
    "Paste this into Cursor and ask the agent to fetch the results before writing the next module.",
    `Student uid: ${uid}`,
    `Read attempts/${uid}, repairs/${uid}, and guides for the missed item ids. Do not rename ${status.strandId}, any item id, or any database path. Add the next strand id named below. If that id already has items, leave those items and use the latest module prompt for that field. Keep the answer, a two-paragraph passage, and followPrompt on the guide, not on the item. A wrong choice opens the in-app reading and a different written question answerable from that reading alone. Do not use external discovery links. Do not show the correct choice to the student.`,
    "",
    `Missed item ids: ${status.missed.length ? status.missed.join(", ") : "none"}`,
    "",
    "Fields:",
    ...fieldLines,
    "",
    "Management is not scored on this check. management-101 stays the Helios order and is not generated from this prompt unless the named topic is management. The Helios essay is the worked example, not the assessment. Student interest checkboxes are a register only; they do not choose the next module.",
    interest,
    "History, politics, and technology share decision-context. Extend that one strand. Do not open three textbooks.",
    "psychology-insight in 2026 may name only four distinctions: a projection against a fact, a need against a vice, a public yes against later commitment, and a pay incentive against intrinsic motivation. Sex, the dark tetrad, sexual polarity, the devotional text, and the demon catalogue stay off the screen. See plan.md, Father's texts.",
    "Early modules stay on primary essential knowledge for the field. A deeper module must broaden range as well as difficulty: cover more of the field and optional branches from the core already taught. List the core ideas already covered and do not only restate them.",
    "Reply with one field. Create one short module of about six to ten questions for that field only, at the difficulty named above. A deeper module uses a new strand id and a higher depth. It does not rename the strand it continues.",
  ].join("\n");
}

function moduleGroups(strands, items) {
  const groups = new Map();
  for (const item of items || []) {
    if (!item.strandId || item.strandId === "placement-check") continue;
    const group = groups.get(item.strandId) || [];
    group.push(item);
    groups.set(item.strandId, group);
  }
  return [...groups].map(([strandId, group]) => ({
    strandId,
    strand: { id: strandId, ...(strands?.[strandId] || {}) },
    items: group,
  }));
}

function moduleOutcome(strand, items, attempts, repairs) {
  const ordered = [...(items || [])].sort((a, b) => a.order - b.order);
  const first = firstAttemptByItem(attempts || []);
  const choiceItems = ordered.filter(isChoiceItem);
  let answered = 0;
  let repairsDue = 0;
  let matched = 0;
  const missed = [];
  for (const item of ordered) {
    const attempt = first.get(item.id);
    if (!attempt) continue;
    answered += 1;
    if (!isChoiceItem(item)) {
      if (!writtenAttemptDone(attempt)) repairsDue += 1;
      continue;
    }
    if (attempt.matched === true) matched += 1;
    else {
      missed.push(item.id);
      if (!repairAnswer(repairs, item.id)) repairsDue += 1;
    }
  }
  const strandId = strand?.id || ordered[0]?.strandId || "";
  const field = strand?.field || ordered[0]?.claim || "";
  const depth = Number(strand?.depth) || 2;
  const tier = ageTiers.find((entry) => entry.id === strand?.ageTier) || ageTiers[1];
  const title = strand?.title || strandId;
  const complete = ordered.length > 0 && answered === ordered.length && repairsDue === 0;
  const holdTotal = choiceItems.length || ordered.length;
  const base = {
    strandId,
    title,
    field,
    depth: 0,
    complete,
    position: null,
    label: "Not finished",
    mode: null,
    nextStrandId: "",
    recommendation: "",
    missed,
    answered,
    total: ordered.length,
    repairsDue,
  };
  if (!complete) return { ...base, matched, held: false, need: heldMatchesNeeded(holdTotal), missDetails: [] };
  const held = sectionHeld(matched, holdTotal);
  const details = missDetailsFor(ordered, attempts, repairs, missed);
  const need = heldMatchesNeeded(holdTotal);
  if (held) {
    const nextId = `${strandId}-depth-${depth + 1}`;
    return {
      ...base,
      matched,
      held: true,
      need,
      missDetails: details,
      depth,
      position: tier.at,
      label: tier.label,
      mode: "deeper",
      nextStrandId: nextId,
      recommendation: `The module held (${matched} of ${holdTotal} choice first attempts; need ${need}). Write the next module one step deeper. Next strand id: ${nextId}. Do not rename ${strandId}. This does not award NCEA.`,
    };
  }
  const nextId = `${strandId}-practice`;
  return {
    ...base,
    matched,
    held: false,
    need,
    missDetails: details,
    depth,
    position: Math.max(0, tier.at - 12),
    label: `Short of ${tier.label}`,
    mode: "same",
    nextStrandId: nextId,
    recommendation: `The module finished but did not hold (${matched} of ${holdTotal} choice first attempts; need ${need}). Write another module in the same field covering the missed questions. Next strand id: ${nextId}. Do not rename ${strandId}. This does not award NCEA.`,
  };
}

function moduleOutcomes(strands, items, attempts, repairs) {
  const results = [];
  for (const group of moduleGroups(strands, items)) {
    const claimIds = [...new Set(group.items.map((item) => item.claim).filter(Boolean))];
    if (!group.strand.field && claimIds.length > 1) {
      for (const claimId of claimIds) {
        const subset = group.items.filter((item) => item.claim === claimId);
        results.push(moduleOutcome({ ...group.strand, field: claimId }, subset, attempts, repairs));
      }
      continue;
    }
    results.push(moduleOutcome(group.strand, group.items, attempts, repairs));
  }
  return results;
}

function studyQueue(strands, items) {
  return moduleGroups(strands, items)
    .map((group) => ({
      strand: group.strand,
      items: [...group.items].sort((a, b) => a.order - b.order),
    }))
    .sort((a, b) => (Number(a.strand.order) || 999) - (Number(b.strand.order) || 999) || a.strand.id.localeCompare(b.strand.id));
}

function nextOpenModule(queue, attempts, repairs) {
  for (const entry of queue || []) {
    const outcome = moduleOutcome(entry.strand, entry.items, attempts, repairs);
    if (!outcome.complete) return { ...entry, outcome };
  }
  return null;
}

function applyModules(marks, modules) {
  const next = (marks || []).map((mark) => ({ ...mark }));
  for (const outcome of modules || []) {
    if (!outcome.complete || !outcome.field) continue;
    const mark = next.find((entry) => entry.claimId === outcome.field);
    if (!mark || outcome.depth <= mark.depth) continue;
    mark.depth = outcome.depth;
    mark.position = outcome.position;
    mark.label = outcome.label;
    mark.mode = outcome.mode;
    mark.nextStrandId = outcome.nextStrandId;
    mark.recommendation = outcome.recommendation;
    mark.unsettled = false;
  }
  return next;
}

const extraFields = [
  { id: "electronics", title: "Electronics" },
  { id: "economics", title: "Economics" },
  { id: "finance", title: "Finance" },
  { id: "accounting", title: "Accounting" },
  { id: "marketing", title: "Marketing" },
  { id: "management", title: "Management" },
  { id: "business", title: "Business" },
  { id: "statistics", title: "Statistics" },
  { id: "computerScience", title: "Computer science" },
  { id: "law", title: "Law" },
  { id: "philosophy", title: "Philosophy" },
  { id: "sociology", title: "Sociology" },
  { id: "anthropology", title: "Anthropology" },
  { id: "literature", title: "Literature" },
  { id: "linguistics", title: "Linguistics" },
  { id: "design", title: "Design" },
  { id: "aiLiteracy", title: "AI literacy" },
  { id: "architecture", title: "Architecture" },
];

function chartMarks(marks, modules) {
  const rows = [...(marks || [])];
  for (const field of extraFields) {
    const done = (modules || []).filter((outcome) => outcome.field === field.id && outcome.complete && outcome.depth > 0);
    const best = done.sort((a, b) => b.depth - a.depth)[0];
    rows.push(best ? {
      claimId: field.id,
      title: field.title,
      peer: peerAt,
      depth: best.depth,
      position: best.position,
      label: best.label,
      mode: best.mode,
      nextStrandId: best.nextStrandId,
      recommendation: best.recommendation,
      unsettled: false,
    } : {
      claimId: field.id,
      title: field.title,
      peer: peerAt,
      depth: 0,
      position: null,
      label: "Not started",
      mode: null,
      nextStrandId: "",
      recommendation: "",
      unsettled: false,
    });
  }
  return rows;
}

const fieldTitles = {
  claims: "Claims and evidence",
  electronics: "Electronics",
  economics: "Economics",
  finance: "Finance",
  accounting: "Accounting",
  marketing: "Marketing",
  management: "Management",
  business: "Business",
  statistics: "Statistics",
  computerScience: "Computer science",
  law: "Law",
  philosophy: "Philosophy",
  sociology: "Sociology",
  anthropology: "Anthropology",
  literature: "Literature",
  linguistics: "Linguistics",
  design: "Design",
  aiLiteracy: "AI literacy",
  architecture: "Architecture",
};

const fieldOrder = [...claims.map((claim) => claim.id), ...Object.keys(fieldTitles)];

function strandRecord(strands, strandId) {
  if (!strands || !strandId) return {};
  if (Array.isArray(strands)) return strands.find((strand) => strand.id === strandId) || {};
  return strands[strandId] || {};
}

function fieldIdFor(strands, item) {
  const strand = strandRecord(strands, item?.strandId);
  return strand.field || item?.claim || item?.strandId || "";
}

function fieldTitle(id) {
  return claims.find((claim) => claim.id === id)?.title || fieldTitles[id] || id;
}

function strandOrder(strands, strandId) {
  const order = Number(strandRecord(strands, strandId).order);
  return Number.isFinite(order) ? order : 999;
}

function itemsInField(strands, items, fieldId) {
  return (items || [])
    .filter((item) => fieldIdFor(strands, item) === fieldId)
    .sort((a, b) => strandOrder(strands, a.strandId) - strandOrder(strands, b.strandId)
      || (Number(a.order) || 0) - (Number(b.order) || 0)
      || String(a.id).localeCompare(String(b.id)));
}

function fieldProgress(strands, items, attempts) {
  const first = firstAttemptByItem(attempts || []);
  const ids = [];
  for (const item of items || []) {
    const id = fieldIdFor(strands, item);
    if (id && !ids.includes(id)) ids.push(id);
  }
  ids.sort((a, b) => {
    const left = fieldOrder.indexOf(a);
    const right = fieldOrder.indexOf(b);
    return (left === -1 ? 999 : left) - (right === -1 ? 999 : right) || a.localeCompare(b);
  });
  return ids.map((id) => {
    const group = itemsInField(strands, items, id);
    return {
      id,
      title: fieldTitle(id),
      answered: group.filter((item) => first.has(item.id)).length,
      total: group.length,
    };
  });
}

function fieldPlace(strands, items, item) {
  const id = fieldIdFor(strands, item);
  const group = itemsInField(strands, items, id);
  const found = group.findIndex((entry) => entry.id === item?.id);
  return {
    id,
    title: fieldTitle(id),
    index: found === -1 ? 1 : found + 1,
    total: group.length || 1,
  };
}

function isPlacementStrand(strandId) {
  return strandId === "placement-check" || String(strandId || "").startsWith("decision-context");
}

function strandIdsInField(strands, items, fieldId) {
  const ids = [];
  for (const item of itemsInField(strands, items, fieldId)) {
    if (!item.strandId || isPlacementStrand(item.strandId) || ids.includes(item.strandId)) continue;
    ids.push(item.strandId);
  }
  return ids;
}

/** Sequential module number within a field (I, II, III…), excluding placement strands. */
function moduleSequence(strands, items, fieldId, firstAttempts, complete) {
  const strandIds = strandIdsInField(strands, items, fieldId);
  if (!strandIds.length) {
    return complete ? { moduleIndex: 1, nextIndex: 2 } : { moduleIndex: 1, nextIndex: 0 };
  }
  let finished = 0;
  let started = false;
  for (const strandId of strandIds) {
    const group = (items || []).filter((item) => item.strandId === strandId);
    const answered = group.filter((item) => firstAttempts.has(item.id)).length;
    if (answered > 0) started = true;
    if (group.length && answered >= group.length) finished += 1;
  }
  if (complete) {
    const index = Math.max(1, strandIds.length);
    return { moduleIndex: index, nextIndex: index + 1 };
  }
  if (!started) return { moduleIndex: 1, nextIndex: 0 };
  return { moduleIndex: Math.max(1, finished + 1), nextIndex: 0 };
}

function strandHasItems(items, strandId) {
  if (!strandId) return false;
  return (items || []).some((item) => item.strandId === strandId);
}

function writtenAttemptDone(attempt) {
  return typeof attempt?.answer === "string" && attempt.answer.trim().length > 0;
}

function fieldStudy(strands, items, attempts, repairs) {
  const progress = fieldProgress(strands, items, attempts);
  const modules = moduleOutcomes(strands, items, attempts, repairs);
  const first = firstAttemptByItem(attempts || []);
  return progress.map((field) => {
    const group = itemsInField(strands, items, field.id);
    const choiceItems = group.filter(isChoiceItem);
    let repairsDue = 0;
    let matched = 0;
    const missed = [];
    for (const item of group) {
      const attempt = first.get(item.id);
      if (!attempt) continue;
      if (!isChoiceItem(item)) {
        if (!writtenAttemptDone(attempt)) repairsDue += 1;
        continue;
      }
      if (attempt.matched === true) matched += 1;
      else {
        missed.push(item.id);
        if (!repairAnswer(repairs, item.id)) repairsDue += 1;
      }
    }
    const best = modules
      .filter((outcome) => outcome.field === field.id && outcome.complete && outcome.depth > 0)
      .sort((a, b) => b.depth - a.depth)[0];
    const complete = field.total > 0 && field.answered === field.total && repairsDue === 0;
    const choiceTotal = choiceItems.length;
    const held = complete && sectionHeld(matched, choiceTotal || field.total);
    const missDetails = missDetailsFor(group, attempts, repairs, missed);
    const need = heldMatchesNeeded(choiceTotal || field.total);
    const results = group.map((item) => {
      const attempt = first.get(item.id);
      if (!attempt) return "open";
      if (!isChoiceItem(item)) return writtenAttemptDone(attempt) ? "held" : "missed";
      return attempt.matched === true ? "held" : "missed";
    });
    let label = best?.label || (field.answered ? "In progress" : "Not started");
    if (complete && !held) label = "Needs another module";
    else if (complete && held) label = best?.label || "Held";
    const depth = best?.depth || 0;
    const mode = complete ? (held ? "deeper" : "same") : null;
    const nextStrandId = best?.nextStrandId || (held ? `${field.id}-cluster-2` : `${field.id}-practice`);
    const awaitingModule = complete && !strandHasItems(items, nextStrandId);
    const sequence = moduleSequence(strands, items, field.id, first, complete);
    return {
      ...field,
      repairsDue,
      complete,
      matched,
      held,
      need,
      missed,
      missDetails,
      results,
      depth,
      label,
      mode,
      nextStrandId,
      awaitingModule,
      moduleIndex: sequence.moduleIndex,
      moduleRoman: moduleLabel(sequence.moduleIndex),
      nextModuleRoman: sequence.nextIndex ? moduleLabel(sequence.nextIndex) : "",
    };
  });
}

/**
 * Aggregate modules that students are waiting on (current field content exhausted).
 * Rows are keyed by nextStrandId so admin can copy one production prompt per gap.
 */
function modulesToProduce(students) {
  const byNext = new Map();
  for (const student of students || []) {
    for (const field of student.fields || []) {
      if (!field?.complete || !field.awaitingModule) continue;
      const key = field.nextStrandId || `${field.id}-${field.mode || "next"}`;
      const row = byNext.get(key) || {
        key,
        fieldId: field.id,
        title: field.title,
        mode: field.mode,
        held: field.held === true,
        nextStrandId: field.nextStrandId,
        depth: field.depth,
        moduleRoman: field.moduleRoman,
        nextModuleRoman: field.nextModuleRoman,
        matched: field.matched,
        total: field.total,
        need: field.need,
        students: [],
        prompt: "",
      };
      if (!row.students.some((entry) => entry.uid === student.uid)) {
        row.students.push({ uid: student.uid, name: student.name });
      }
      if (!row.prompt) {
        row.prompt = fieldClusterPrompt({
          name: student.name,
          uid: student.uid,
          field,
        });
      }
      byNext.set(key, row);
    }
  }
  return [...byNext.values()].sort((a, b) => a.title.localeCompare(b.title)
    || String(a.nextStrandId).localeCompare(String(b.nextStrandId)));
}

/** Warn when a domain module is outside the 5–8 choice-question scope (placement strands skipped). */
function moduleScopeIssues(strands, items) {
  const issues = [];
  for (const group of moduleGroups(strands, items)) {
    const strand = group.strand;
    if (!strand?.field) continue;
    if (strand.id === "placement-check" || strand.id?.startsWith("decision-context")) continue;
    const n = group.items.filter(isChoiceItem).length;
    if (n < MODULE_QUESTION_MIN || n > MODULE_QUESTION_MAX) {
      issues.push({
        strandId: strand.id,
        field: strand.field,
        count: n,
        message: `${strand.id} has ${n} choice questions; domain modules should have ${MODULE_QUESTION_MIN}–${MODULE_QUESTION_MAX} (target ${MODULE_QUESTION_TARGET}) for the 5-of-6 hold rule.`,
      });
    }
  }
  return issues;
}

function isChoiceItem(item) {
  return !item?.answerKind || item.answerKind === "choice";
}

function nextFieldStep(strands, items, attempts, repairs, fieldId) {
  const group = itemsInField(strands, items, fieldId);
  const first = firstAttemptByItem(attempts || []);
  for (const item of group) {
    const attempt = first.get(item.id);
    const index = group.indexOf(item) + 1;
    if (!attempt) {
      if (!isChoiceItem(item)) {
        return { kind: "written", item, index, total: group.length };
      }
      return { kind: "question", item, index, total: group.length };
    }
    if (isChoiceItem(item) && attempt.matched !== true && !repairAnswer(repairs, item.id)) {
      return { kind: "repair", item, selected: attempt.selected || "", index, total: group.length };
    }
  }
  return { kind: "done", item: null, index: group.length, total: group.length };
}

function fieldClusterPrompt({ name, uid, field }) {
  if (!field?.complete) return "";
  const held = field.held === true;
  const aim = held
    ? "The sitting held. Write the next deeper cluster for this field only."
    : "The sitting finished but did not hold. Write another module in the same field covering the missed questions below. Do not open a deeper branch yet.";
  return [
    `Field complete: ${field.id}, ${field.title}.`,
    `${name} has finished every current question in ${field.title}, and every miss has a written repair. First attempts matched ${field.matched} of ${field.total} (need ${field.need} to hold). Depth ${field.depth}. ${field.label}.`,
    aim,
    `Student uid: ${uid}`,
    `Read attempts/${uid}, repairs/${uid}, and the guides for misses in this field.`,
    ...missDetailLines(field.missDetails),
    `Next strand id: ${field.nextStrandId}. Do not rename existing strands, item ids, or database paths.`,
    held
      ? "This next cluster must deepen and broaden from the core already taught in this field: cover more range and optional branches, and list which core ideas were already covered so new items do not only restate them."
      : "Stay at the same difficulty. Teach the ideas behind the missed questions. List those ideas and do not only restate the earlier items.",
    "Add about six choice questions. All four choices must be similar in length and form; wrong answers must be plausible misconceptions, never jokes or absurd giveaways. Each guide holds the answer, exactly two passage paragraphs that bury the idea without quoting the correct choice text, and a followPrompt answerable from that reading alone. A wrong choice opens the in-app reading, not an external link. Do not show the correct choice to the student.",
    "Keep the cluster suitable for a 15-year-old in the New Zealand curriculum. This does not award NCEA. Interest checkboxes are a register only and do not choose this module. Branches are added when a result needs them; do not invent a full textbook in advance.",
    "Never telegraph the key: no joke distractors, and do not make the correct option obviously longer or more serious than the others.",
  ].join("\n");
}

function modulePrompt({ name, uid, outcome }) {
  if (!outcome?.complete) return "";
  const missed = outcome.missed.length ? outcome.missed.join(", ") : "none";
  const aim = outcome.held
    ? "Write the next deeper module for this field."
    : "Write another module in the same field covering the missed questions. Do not open a deeper branch yet.";
  return [
    `Section complete: ${outcome.strandId}, ${outcome.title}, depth ${outcome.depth} module.`,
    `${name} finished this module. ${outcome.recommendation}`,
    aim,
    `Student uid: ${uid}`,
    `Read attempts/${uid}, repairs/${uid}, and guides for the missed item ids. Field: ${outcome.field}.`,
    `Missed item ids: ${missed}`,
    ...missDetailLines(outcome.missDetails),
    "Do not rename the strand, any item id, or any database path. Keep guides off the item. Each new item needs a two-paragraph in-app passage and a followPrompt from that reading. No external discovery links. Do not show the correct choice to the student. This does not award NCEA. Branches grow when a result needs them.",
  ].join("\n");
}

export {
  ageTiers,
  peerAt,
  heldMatchesNeeded,
  sectionHeld,
  toRoman,
  moduleLabel,
  MODULE_QUESTION_MIN,
  MODULE_QUESTION_MAX,
  MODULE_QUESTION_TARGET,
  placementItems,
  sectionStatus,
  fieldMarks,
  expansionPrompt,
  moduleOutcome,
  moduleOutcomes,
  applyModules,
  modulePrompt,
  studyQueue,
  nextOpenModule,
  chartMarks,
  fieldProgress,
  fieldPlace,
  fieldStudy,
  nextFieldStep,
  fieldClusterPrompt,
  modulesToProduce,
  moduleScopeIssues,
  strandHasItems,
};
