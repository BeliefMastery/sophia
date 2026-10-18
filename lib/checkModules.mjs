import { checkPassage } from "./passage.mjs";
import { publicItem } from "./records.mjs";

const ages = new Set(["year9", "year10", "year11", "year12", "year13"]);

function checkModules(strands, items, placementItems) {
  const errors = [];
  const ids = new Set((placementItems || []).map((item) => item.id));
  const strandIds = new Set(strands.map((strand) => strand.id));
  for (const strand of strands) {
    if (!strand.id || strands.filter((entry) => entry.id === strand.id).length !== 1) {
      errors.push(`strand id ${strand.id || "missing"} is missing or repeated`);
    }
    if (strand.id === "placement-check") errors.push("a module must not reuse placement-check");
    if (strand.role !== "module") errors.push(`${strand.id} is not a module`);
    if (!Number.isInteger(strand.depth) || strand.depth < 2) errors.push(`${strand.id} depth must be at least 2`);
    if (!ages.has(strand.ageTier)) errors.push(`${strand.id} age tier is missing`);
    const continuesKnown = strand.continues === "placement-check" || strandIds.has(strand.continues);
    if (!continuesKnown) errors.push(`${strand.id} should continue the placement check or an earlier module`);
    if (!strand.title || !strand.summary) errors.push(`${strand.id} needs a title and summary`);
  }
  const seen = new Set();
  const byStrand = new Map();
  for (const item of items) {
    if (seen.has(item.id) || ids.has(item.id)) errors.push(`item id ${item.id} collides`);
    seen.add(item.id);
    if (!strandIds.has(item.strandId)) errors.push(`${item.id} strand is not in this set`);
    if (!item.prompt || item.prompt.length < 12) errors.push(`${item.id} prompt is too short`);
    const published = publicItem(item);
    if ("answer" in published || "lookFor" in published || "passage" in published || "followPrompt" in published || "predict" in published || "discover" in published) {
      errors.push(`${item.id} public record contains the key`);
    }
    if (item.kind === "research" || item.answerKind === "paragraph" || item.answerKind === "essay") {
      if (item.kind !== "research") errors.push(`${item.id} written item should use kind research`);
      if (!["paragraph", "essay"].includes(item.answerKind)) {
        errors.push(`${item.id} research needs paragraph or essay answerKind`);
      }
      if (published.kind !== "research") errors.push(`${item.id} public record is not research`);
      if (Array.isArray(item.choices) && item.choices.length) {
        errors.push(`${item.id} research must not carry choice keys`);
      }
    } else {
      if (item.kind !== "probe" || item.answerKind !== "choice") errors.push(`${item.id} is not a choice probe`);
      if (!Array.isArray(item.choices) || item.choices.length !== 4) errors.push(`${item.id} needs 4 choices`);
      const choiceIds = new Set((item.choices || []).map((choice) => choice.id));
      const texts = (item.choices || []).map((choice) => choice.text);
      if (choiceIds.size !== 4 || new Set(texts).size !== 4) errors.push(`${item.id} has duplicate choices`);
      if (!choiceIds.has(item.answer)) errors.push(`${item.id} answer is not a choice`);
      const correct = (texts.find((text, index) => item.choices[index].id === item.answer) || "").trim().toLowerCase();
      if (!item.followPrompt || item.followPrompt.trim() === item.prompt.trim()) errors.push(`${item.id} follow-up repeats the question`);
      if (correct && item.followPrompt.toLowerCase().includes(correct)) errors.push(`${item.id} follow-up quotes the correct choice`);
      errors.push(...checkPassage(item));
      if (published.kind !== "probe") errors.push(`${item.id} public record is not a probe`);
    }
    const group = byStrand.get(item.strandId) || [];
    group.push(item);
    byStrand.set(item.strandId, group);
  }
  for (const strand of strands) {
    const group = byStrand.get(strand.id) || [];
    const choiceCount = group.filter((item) => item.answerKind === "choice" || !item.answerKind).length;
    if (choiceCount < 6) errors.push(`${strand.id} needs at least 6 choice questions`);
    if (strand.field && group.some((item) => item.claim !== strand.field)) {
      errors.push(`${strand.id} mixes another field`);
    }
  }
  return errors;
}

export { checkModules };
