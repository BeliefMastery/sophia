/** Catch MC items that telegraph the correct answer. */

const JOKE_PATTERN = /\b(lol|forever|weather|shouting|personalities|pretty\?|wicked\?|fashion only|design(ing)? a logo|controlling the weather|national tax|guess without|hide the|as vague|punish(ing)?|solo forever|hey,|wrecked, sort it)\b/i;

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
  return errors;
}

export { checkChoices, JOKE_PATTERN };
