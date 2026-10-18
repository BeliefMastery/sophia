function publicItem(item) {
  const answerKind = item.answerKind || "choice";
  const record = {
    strandId: item.strandId,
    ideaId: item.ideaId,
    kind: item.kind === "research" ? "research" : item.kind === "probe" ? "probe" : "check",
    order: item.order,
    answerKind,
    claim: item.claim,
    prompt: item.prompt,
  };
  if (answerKind === "choice" && Array.isArray(item.choices)) {
    const choices = {};
    item.choices.forEach((choice, index) => {
      choices[choice.id] = { text: choice.text, order: index + 1 };
    });
    record.choices = choices;
  }
  if (Array.isArray(item.words) && item.words.length) {
    record.words = item.words.map((word) => ({
      term: word.term,
      meaning: word.meaning,
      example: word.example || "",
    }));
  }
  if (item.sourceId) record.sourceId = item.sourceId;
  if (item.predict === "known" || item.predict === "unknown") record.predict = item.predict;
  return record;
}

function guideRecord(item) {
  const record = {
    claim: item.claim,
    lookFor: item.lookFor,
    misconceptions: item.misconceptions,
  };
  if (item.answerKind === "choice" || !item.answerKind) {
    record.answer = item.answer;
    record.passage = item.passage;
    record.followPrompt = item.followPrompt;
  }
  if (Array.isArray(item.repairAccept) && item.repairAccept.length) {
    record.repairAccept = item.repairAccept;
  }
  if (item.predict === "known" || item.predict === "unknown") record.predict = item.predict;
  return record;
}

function repairAnswer(repairs, itemId) {
  const record = repairs?.[itemId];
  const answer = typeof record?.answer === "string" ? record.answer.trim() : "";
  return answer;
}

function openRepair(items, attempts, repairs) {
  const ordered = [...items].sort((a, b) => a.order - b.order);
  const first = firstAttemptByItem(attempts || []);
  for (const item of ordered) {
    const attempt = first.get(item.id);
    if (!attempt) return null;
    if (attempt.matched === true) continue;
    if (!repairAnswer(repairs, item.id)) return { item, selected: attempt.selected || "" };
  }
  return null;
}

function orderedChoices(choices) {
  if (!choices || typeof choices !== "object") return [];
  if (Array.isArray(choices)) {
    return choices
      .map((choice, index) => ({
        id: choice.id,
        text: choice.text,
        order: Number(choice.order) || index + 1,
      }))
      .filter((choice) => choice.id && choice.text)
      .sort((a, b) => a.order - b.order);
  }
  return Object.entries(choices)
    .map(([id, choice]) => ({ id, text: choice?.text, order: choice?.order }))
    .filter((choice) => choice.id && choice.text)
    .sort((a, b) => a.order - b.order);
}

function guideReady(guide) {
  if (!guide || typeof guide !== "object") return false;
  const passage = guide.passage;
  const paragraphs = Array.isArray(passage)
    ? passage.filter((part) => typeof part === "string" && part.trim())
    : typeof passage === "string"
      ? passage.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean)
      : [];
  const follow = typeof guide.followPrompt === "string" && guide.followPrompt.trim();
  return paragraphs.length >= 2 && Boolean(follow);
}

function firstAttemptByItem(attempts) {
  const byItem = new Map();
  for (const attempt of attempts) {
    const previous = byItem.get(attempt.itemId);
    if (!previous || attempt.submittedAt < previous.submittedAt) byItem.set(attempt.itemId, attempt);
  }
  return byItem;
}

function checkRows(items, attempts) {
  const first = firstAttemptByItem(attempts);
  const byClaim = new Map();
  const ordered = [...items].sort((a, b) => a.order - b.order);
  for (const item of ordered) {
    const attempt = first.get(item.id);
    if (!attempt) return { complete: false, next: item, byClaim };
    const rows = byClaim.get(item.claim) || [];
    rows.push({
      predict: item.predict,
      matched: attempt.matched === true,
      selected: attempt.selected || "",
      item,
    });
    byClaim.set(item.claim, rows);
  }
  return { complete: true, next: null, byClaim };
}

export {
  publicItem,
  guideRecord,
  orderedChoices,
  guideReady,
  firstAttemptByItem,
  checkRows,
  openRepair,
  repairAnswer,
};
