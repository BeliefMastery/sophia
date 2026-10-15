function publicItem(item) {
  const choices = {};
  item.choices.forEach((choice, index) => {
    choices[choice.id] = { text: choice.text, order: index + 1 };
  });
  return {
    strandId: item.strandId,
    ideaId: item.ideaId,
    kind: "check",
    order: item.order,
    answerKind: "choice",
    claim: item.claim,
    predict: item.predict,
    prompt: item.prompt,
    choices,
  };
}

function guideRecord(item) {
  return {
    answer: item.answer,
    claim: item.claim,
    predict: item.predict,
    lookFor: item.lookFor,
    misconceptions: item.misconceptions,
    discover: item.discover,
    followPrompt: item.followPrompt,
  };
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
  return Object.entries(choices)
    .map(([id, choice]) => ({ id, text: choice.text, order: choice.order }))
    .sort((a, b) => a.order - b.order);
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

export { publicItem, guideRecord, orderedChoices, firstAttemptByItem, checkRows, openRepair, repairAnswer };
