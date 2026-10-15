import { claims, judgePlacement } from "./claims.mjs";
import { explainMiss } from "./explain.mjs";
import { firstAttemptByItem, repairAnswer } from "./records.mjs";

function studentReport(items, attempts, guides, repairs) {
  const list = Array.isArray(items) ? items : [];
  const history = Array.isArray(attempts) ? attempts : [];
  const keys = guides || {};
  const ordered = [...list].sort((a, b) => a.order - b.order);
  const byId = new Map(ordered.map((item) => [item.id, item]));
  const first = firstAttemptByItem(history);
  const byClaim = new Map();
  const expectedByClaim = new Map();
  let correct = 0;
  let incorrect = 0;
  let lastAt = 0;

  for (const item of ordered) expectedByClaim.set(item.claim, (expectedByClaim.get(item.claim) || 0) + 1);

  const questions = [];
  for (const item of ordered) {
    const attempt = first.get(item.id);
    if (!attempt) continue;
    const matched = attempt.matched === true;
    if (matched) correct += 1;
    else incorrect += 1;
    if (Number(attempt.submittedAt) > lastAt) lastAt = Number(attempt.submittedAt);
    const rows = byClaim.get(item.claim) || [];
    rows.push({
      predict: item.predict,
      matched,
      selected: attempt.selected || "",
      item,
    });
    byClaim.set(item.claim, rows);
    const explained = explainMiss(item, keys[item.id]);
    questions.push({
      id: item.id,
      order: item.order,
      claim: item.claim,
      prompt: item.prompt,
      chosen: item.choices?.[attempt.selected]?.text || "",
      matched,
      submittedAt: Number(attempt.submittedAt) || 0,
      answerText: explained.answerText,
      explanation: explained.explanation,
      slips: explained.slips,
      repair: repairAnswer(repairs, item.id),
    });
  }

  const verdicts = [];
  for (const claim of claims) {
    const rows = byClaim.get(claim.id) || [];
    const expected = expectedByClaim.get(claim.id) || 0;
    if (!rows.length || !expected) continue;
    if (rows.length < expected) {
      verdicts.push({
        claimId: claim.id,
        title: claim.title,
        assessment: claim.assessment,
        open: true,
        answered: rows.length,
        total: expected,
      });
      continue;
    }
    verdicts.push({ ...judgePlacement([claim], byClaim)[0], open: false });
  }

  const activity = [...history].sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0)).map((attempt) => {
    const item = byId.get(attempt.itemId);
    const counted = first.get(attempt.itemId)?.submittedAt === attempt.submittedAt;
    const explained = explainMiss(item, keys[attempt.itemId]);
    return {
      id: attempt.id || "",
      itemId: attempt.itemId,
      prompt: item?.prompt || attempt.itemId,
      chosen: item?.choices?.[attempt.selected]?.text || "",
      matched: attempt.matched === true,
      submittedAt: Number(attempt.submittedAt) || 0,
      counted,
      answerText: explained.answerText,
      explanation: explained.explanation,
      repair: repairAnswer(repairs, attempt.itemId),
    };
  });

  return {
    answered: correct + incorrect,
    total: ordered.length,
    correct,
    incorrect,
    lastAt,
    questions,
    verdicts,
    activity,
  };
}

export { studentReport };
