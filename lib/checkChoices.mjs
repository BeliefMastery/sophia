/** Catch MC items that telegraph the correct answer by tone or repeated distractor shape. */

const JOKE_PATTERN = /\b(lol|forever|weather|shouting|personalities|pretty\?|wicked\?|fashion only|design(ing)? a logo|controlling the weather|national tax|guess without|hide the|as vague|punish(ing)?|solo forever|hey,|wrecked, sort it)\b/i;

/** Openings that become a tell when two or more wrong answers share them. */
const LOCKED_OPENINGS = [
  [/^only\s+/i, "Only…"],
  [/^[a-z]+ing\s+/i, "Gerund…"],
  [/^calling\s+/i, "Calling…"],
  [/^treating\s+/i, "Treating…"],
  [/^ignoring\s+/i, "Ignoring…"],
  [/^keeping\s+/i, "Keeping…"],
  [/^waiting\s+/i, "Waiting…"],
  [/^repeating\s+/i, "Repeating…"],
  [/^it\s+makes\s+/i, "It makes…"],
  [/^it\s+proves\s+/i, "It proves…"],
  [/^a way to\s+/i, "A way to…"],
  [/^every\s+/i, "Every…"],
  [/^no\s+[a-z]/i, "No…"],
];

function isUniformAnswerSet(choices) {
  const texts = choices.map((choice) => String(choice.text || "").trim());
  if (texts.every((text) => /^[\d.]+$/.test(text))) return true;
  if (texts.every((text) => /^\d{4}$/.test(text))) return true;
  if (texts.every((text) => /^x\s*=/i.test(text))) return true;
  if (texts.every((text) => /^\d+(\.\d+)?\s*(cm|m|mm|kg|g|s|%|mol)\b/i.test(text))) return true;
  if (texts.every((text) => /^about\s+/i.test(text) && texts[0].split(/\s+/).length <= 4)) return true;
  if (texts.every((text) => /^the solution with pH\s+/i.test(text))) return true;
  if (texts.every((text) => text.includes("—") && text.split("—")[0].trim().split(/\s+/).length <= 2)) {
    return true;
  }
  if (texts.every((text) => text.split(",").length >= 3 && text.length < 80)) return true;
  // Very short parallel answers (numbers, symbols, brief labels) — not full sentences.
  if (texts.every((text) => text.length <= 18)) return true;
  return false;
}

function openingLabel(text) {
  const raw = String(text || "").trim();
  for (const [pattern, label] of LOCKED_OPENINGS) {
    if (pattern.test(raw)) return label;
  }
  const words = raw.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 2).join(" ");
  return words || "(empty)";
}

function checkChoices(item) {
  const errors = [];
  if (!item || item.answerKind === "essay" || item.answerKind === "paragraph" || item.kind === "research") {
    return errors;
  }
  const choices = item.choices || [];
  if (choices.length !== 4) return errors;
  const correct = choices.find((choice) => choice.id === item.answer);
  if (!correct) return errors;
  const wrongs = choices.filter((choice) => choice.id !== item.answer);
  const correctLen = String(correct.text || "").trim().length;
  const wrongLens = wrongs.map((choice) => String(choice.text || "").trim().length).filter((n) => n > 0);
  if (wrongLens.length) {
    const shortestWrong = Math.min(...wrongLens);
    if (shortestWrong > 0 && correctLen / shortestWrong >= 1.75 && correctLen - shortestWrong >= 20) {
      errors.push(`${item.id} correct choice is much longer than the shortest distractor`);
    }
  }
  for (const wrong of wrongs) {
    if (JOKE_PATTERN.test(wrong.text || "")) {
      errors.push(`${item.id} distractor looks like a joke or absurd giveaway: ${wrong.text}`);
    }
  }
  const withDash = choices.filter((choice) => String(choice.text || "").includes("—")).length;
  if (withDash === 1 && String(correct.text || "").includes("—")) {
    errors.push(`${item.id} only the correct choice has an em-dash explanation`);
  }

  if (!isUniformAnswerSet(choices)) {
    const correctLabel = openingLabel(correct.text);
    const labels = wrongs.map((wrong) => openingLabel(wrong.text));
    const counts = new Map();
    for (const label of labels) counts.set(label, (counts.get(label) || 0) + 1);
    for (const [label, count] of counts) {
      const locked = LOCKED_OPENINGS.some((entry) => entry[1] === label);
      // Locked openings on wrongs are a tell only when the correct option does not share them.
      if (count >= 2 && locked && label !== correctLabel) {
        errors.push(`${item.id} uses the same distractor opening (${label}) more than once — vary the phrasing`);
      }
      // Three wrongs share a shape the correct answer does not → wrongs form a recognisable clique.
      if (count >= 3 && label !== correctLabel) {
        errors.push(`${item.id} all three distractors share opening "${label}" while the correct option does not`);
      }
    }
  }
  return errors;
}

export { checkChoices, JOKE_PATTERN, isUniformAnswerSet, openingLabel };
