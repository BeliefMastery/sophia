import { claims } from "./claims.mjs";
import { checkChoices } from "./checkChoices.mjs";
import { checkPassage } from "./passage.mjs";
import { publicItem } from "./records.mjs";

const singleKnown = new Set(["mathematics", "psychology", "socialManagement"]);
const singleUnknown = new Set(["physics", "biology", "geology", "history", "politics", "technology"]);
const split = new Set(["english", "chemistry"]);

function checkContent(strand, items) {
  const errors = [];
  if (strand.domain !== "placement" || strand.order !== 0) errors.push("strand is not the placement check");
  if (strand.depth !== 1 || strand.role !== "survey" || strand.ageTier !== "year10") {
    errors.push("placement check must stay a depth 1 year 10 survey");
  }
  if (items.length !== 33) errors.push(`expected 33 items, found ${items.length}`);
  const ids = new Set();
  const orders = new Set();
  const byClaim = new Map();
  for (const item of items) {
    if (ids.has(item.id)) errors.push(`duplicate id ${item.id}`);
    ids.add(item.id);
    if (orders.has(item.order)) errors.push(`duplicate order ${item.order}`);
    orders.add(item.order);
    if (item.strandId !== "placement-check" || item.kind !== "check" || item.answerKind !== "choice") {
      errors.push(`${item.id} is not a placement choice`);
    }
    if (item.ideaId !== `placement-${item.claim}`) errors.push(`${item.id} ideaId does not match the claim`);
    if (!["known", "unknown"].includes(item.predict)) errors.push(`${item.id} predict is missing`);
    if (!item.prompt || item.prompt.length < 12) errors.push(`${item.id} prompt is too short`);
    if (!Array.isArray(item.choices) || item.choices.length !== 4) errors.push(`${item.id} needs 4 choices`);
    const choiceIds = new Set((item.choices || []).map((choice) => choice.id));
    if (choiceIds.size !== 4) errors.push(`${item.id} has duplicate choice ids`);
    if (!choiceIds.has(item.answer)) errors.push(`${item.id} answer is not a choice`);
    const texts = new Set((item.choices || []).map((choice) => choice.text));
    if (texts.size !== 4) errors.push(`${item.id} has duplicate choice text`);
    if (item.lookFor.some((line) => item.choices.some((choice) => line.includes(choice.text) && choice.id === item.answer && choice.text.length > 40))) {
      errors.push(`${item.id} lookFor quotes the correct choice`);
    }
    const correctText = (item.choices.find((choice) => choice.id === item.answer)?.text || "").trim().toLowerCase();
    if (!item.followPrompt || item.followPrompt.trim().length < 12) errors.push(`${item.id} follow-up is too short`);
    if (item.followPrompt && item.followPrompt.trim() === item.prompt.trim()) errors.push(`${item.id} follow-up repeats the question`);
    if (correctText && item.followPrompt && item.followPrompt.toLowerCase().includes(correctText)) {
      errors.push(`${item.id} follow-up quotes the correct choice`);
    }
    errors.push(...checkPassage(item));
    errors.push(...checkChoices(item));
    const published = publicItem(item);
    if ("answer" in published || "lookFor" in published || "misconceptions" in published || "passage" in published || "followPrompt" in published || "discover" in published) {
      errors.push(`${item.id} public record contains the key`);
    }
    const group = byClaim.get(item.claim) || [];
    group.push(item);
    byClaim.set(item.claim, group);
  }
  if (byClaim.size !== claims.length) errors.push("claim coverage does not match the notes");
  for (const claim of claims) {
    const group = byClaim.get(claim.id) || [];
    if (group.length !== 3) errors.push(`${claim.id} does not have 3 questions`);
    const predicts = group.map((item) => item.predict);
    if (singleKnown.has(claim.id) && predicts.some((predict) => predict !== "known")) {
      errors.push(`${claim.id} should be all known`);
    }
    if (singleUnknown.has(claim.id) && predicts.some((predict) => predict !== "unknown")) {
      errors.push(`${claim.id} should be all unknown`);
    }
    if (split.has(claim.id)) {
      const known = predicts.filter((predict) => predict === "known").length;
      const unknown = predicts.filter((predict) => predict === "unknown").length;
      if (known !== 2 || unknown !== 1) errors.push(`${claim.id} should be two known and one unknown`);
    }
  }
  const expectedOrders = new Set(Array.from({ length: 33 }, (_, index) => index + 1));
  for (const order of orders) expectedOrders.delete(order);
  if (expectedOrders.size) errors.push("orders are not 1 through 33");
  return errors;
}

export { checkContent };
