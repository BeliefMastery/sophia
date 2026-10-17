function checkKnowledgeTree(nodes) {
  const errors = [];
  if (!Array.isArray(nodes) || !nodes.length) return ["knowledge tree needs nodes"];
  const ids = new Set();
  for (const node of nodes) {
    if (!node?.id || typeof node.id !== "string") {
      errors.push("node missing id");
      continue;
    }
    if (ids.has(node.id)) errors.push(`duplicate node id ${node.id}`);
    else ids.add(node.id);
    if (!node.title) errors.push(`${node.id} missing title`);
    if (node.status !== "live" && node.status !== "planned") {
      errors.push(`${node.id} status must be live or planned`);
    }
    if (!Number.isInteger(node.tier) || node.tier < 0) {
      errors.push(`${node.id} tier must be a non-negative integer`);
    }
    if (node.parentId != null && typeof node.parentId !== "string") {
      errors.push(`${node.id} parentId invalid`);
    }
  }
  for (const node of nodes) {
    if (node.parentId && !ids.has(node.parentId)) {
      errors.push(`${node.id} parent ${node.parentId} missing`);
    }
  }
  return errors;
}

export { checkKnowledgeTree };
