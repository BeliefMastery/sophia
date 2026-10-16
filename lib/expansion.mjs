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
    `Read attempts/${uid}, repairs/${uid}, and guides for the missed item ids. Do not rename ${status.strandId}, any item id, or any database path. Add the next strand id named below. If that id already has items, leave those items and use the latest module prompt for that field. Keep the answer, discover, and followPrompt on the guide, not on the item. A wrong choice still opens resources and a different written question. Do not show the correct choice to the student.`,
    "",
    `Missed item ids: ${status.missed.length ? status.missed.join(", ") : "none"}`,
    "",
    "Fields:",
    ...fieldLines,
    "",
    "Interests already named: management and psychology. Management is not scored on this check. management-101 stays the Helios order and is not generated from this prompt unless the named topic is management. The Helios essay is the worked example, not her assessment.",
    interest,
    "History, politics, and technology share decision-context. Extend that one strand. Do not open three textbooks.",
    "psychology-insight in 2026 may name only four distinctions: a projection against a fact, a need against a vice, a public yes against later commitment, and a pay incentive against intrinsic motivation. Sex, the dark tetrad, sexual polarity, the devotional text, and the demon catalogue stay off the screen. See plan.md, Father's texts.",
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
  let answered = 0;
  let repairsDue = 0;
  let matched = 0;
  const missed = [];
  for (const item of ordered) {
    const attempt = first.get(item.id);
    if (!attempt) continue;
    answered += 1;
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
  if (!complete) return base;
  const held = matched * 2 > ordered.length;
  if (held) {
    const nextId = `${strandId}-depth-${depth + 1}`;
    return {
      ...base,
      depth,
      position: tier.at,
      label: tier.label,
      mode: "deeper",
      nextStrandId: nextId,
      recommendation: `The module held at ${tier.label}, age ${tier.age}. Write the next module one step deeper. Next strand id: ${nextId}. Do not rename ${strandId}. This does not award NCEA.`,
    };
  }
  const nextId = `${strandId}-practice`;
  return {
    ...base,
    depth,
    position: Math.max(0, tier.at - 12),
    label: `Short of ${tier.label}`,
    mode: "same",
    nextStrandId: nextId,
    recommendation: `The module did not hold at ${tier.label}. Write another module at the same difficulty. Next strand id: ${nextId}. Do not rename ${strandId}. This does not award NCEA.`,
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

function fieldStudy(strands, items, attempts, repairs) {
  const progress = fieldProgress(strands, items, attempts);
  const modules = moduleOutcomes(strands, items, attempts, repairs);
  const first = firstAttemptByItem(attempts || []);
  return progress.map((field) => {
    const group = itemsInField(strands, items, field.id);
    let repairsDue = 0;
    for (const item of group) {
      const attempt = first.get(item.id);
      if (attempt && attempt.matched !== true && !repairAnswer(repairs, item.id)) repairsDue += 1;
    }
    const best = modules
      .filter((outcome) => outcome.field === field.id && outcome.complete && outcome.depth > 0)
      .sort((a, b) => b.depth - a.depth)[0];
    const complete = field.total > 0 && field.answered === field.total && repairsDue === 0;
    return {
      ...field,
      repairsDue,
      complete,
      depth: best?.depth || 0,
      label: best?.label || (field.answered ? "In progress" : "Not started"),
      nextStrandId: best?.nextStrandId || `${field.id}-cluster-2`,
    };
  });
}

function nextFieldStep(strands, items, attempts, repairs, fieldId) {
  const group = itemsInField(strands, items, fieldId);
  const first = firstAttemptByItem(attempts || []);
  for (const item of group) {
    const attempt = first.get(item.id);
    const index = group.indexOf(item) + 1;
    if (!attempt) return { kind: "question", item, index, total: group.length };
    if (attempt.matched !== true && !repairAnswer(repairs, item.id)) {
      return { kind: "repair", item, selected: attempt.selected || "", index, total: group.length };
    }
  }
  return { kind: "done", item: null, index: group.length, total: group.length };
}

function fieldClusterPrompt({ name, uid, field }) {
  if (!field?.complete) return "";
  return [
    `Field complete: ${field.id}, ${field.title}.`,
    `${name} has finished every current question in ${field.title}, and every miss has a written repair. Depth ${field.depth}. ${field.label}.`,
    "This is the end of the current section. Write the next cluster for this field only.",
    `Student uid: ${uid}`,
    `Read attempts/${uid}, repairs/${uid}, and the guides for misses in this field.`,
    `Next strand id: ${field.nextStrandId}. Do not rename existing strands, item ids, or database paths.`,
    "Add about six choice questions on the same guide model: discover, followPrompt, and the answer stay on the guide. A wrong choice opens a resource and a different written question. Do not show the correct choice to the student.",
    "Keep the cluster suitable for a 15-year-old in the New Zealand curriculum. This does not award NCEA.",
  ].join("\n");
}

function modulePrompt({ name, uid, outcome }) {
  if (!outcome?.complete) return "";
  const missed = outcome.missed.length ? outcome.missed.join(", ") : "none";
  return [
    `Section complete: ${outcome.strandId}, ${outcome.title}, depth ${outcome.depth} module.`,
    `${name} finished this module. ${outcome.recommendation}`,
    `Student uid: ${uid}`,
    `Read attempts/${uid}, repairs/${uid}, and guides for the missed item ids. Field: ${outcome.field}.`,
    `Missed item ids: ${missed}`,
    "Do not rename the strand, any item id, or any database path. Keep guides off the item. Do not show the correct choice to the student. This does not award NCEA.",
  ].join("\n");
}

export {
  ageTiers,
  peerAt,
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
};
