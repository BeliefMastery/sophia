const MIN_PARAGRAPH = 80;

function correctChoiceText(item) {
  const choices = item?.choices || [];
  const found = Array.isArray(choices)
    ? choices.find((choice) => choice.id === item.answer)
    : null;
  return (found?.text || "").trim();
}

function stripCorrect(text, correct) {
  if (!correct || correct.length < 2) return text;
  const escaped = correct.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(escaped, "gi"), "the value that fits");
}

function topicLabel(item) {
  const entry = (item.discover || []).find((row) => row?.label);
  if (entry?.label) {
    return entry.label.replace(/^search:\s*/i, "").replace(/\.$/, "").trim();
  }
  return item.claim || item.ideaId || "this idea";
}

function buildPassage(item) {
  if (Array.isArray(item.passage) && item.passage.length === 2) {
    return item.passage.map((line) => String(line).trim());
  }
  const topic = topicLabel(item);
  const idea = (item.lookFor || []).filter(Boolean).join(" ");
  const slip = (item.misconceptions || []).filter(Boolean).join(" ");
  const correct = correctChoiceText(item);
  let first = idea
    ? `Here is the idea behind ${topic}. ${idea} Put that in your own words before you answer the written question.`
    : `Here is the idea behind ${topic}. Notice what the question is really asking, then explain that idea in plain words.`;
  let second = slip
    ? `A common mix-up is this: ${slip} Watch for that, then answer the written question using only what this reading explains.`
    : `A common mix-up is grabbing a familiar answer without checking whether it fits this question. Watch for that, then answer the written question using only what this reading explains.`;
  first = stripCorrect(first, correct);
  second = stripCorrect(second, correct);
  if (first.length < MIN_PARAGRAPH) {
    first += " Say the key point out loud once, then check that you have not skipped a step.";
  }
  if (second.length < MIN_PARAGRAPH) {
    second += " The next question uses the same idea in a new situation, so this reading is your source.";
  }
  return [first.trim(), second.trim()];
}

function checkPassage(item) {
  const errors = [];
  const id = item?.id || "?";
  const correct = correctChoiceText(item).toLowerCase();
  if (!Array.isArray(item?.passage) || item.passage.length !== 2) {
    errors.push(`${id} needs exactly two passage paragraphs`);
    return errors;
  }
  item.passage.forEach((paragraph, index) => {
    if (typeof paragraph !== "string" || paragraph.trim().length < MIN_PARAGRAPH) {
      errors.push(`${id} passage paragraph ${index + 1} is too short`);
    }
    if (correct && typeof paragraph === "string" && paragraph.toLowerCase().includes(correct)) {
      errors.push(`${id} passage quotes the correct choice`);
    }
  });
  return errors;
}

export { MIN_PARAGRAPH, buildPassage, checkPassage, correctChoiceText };
