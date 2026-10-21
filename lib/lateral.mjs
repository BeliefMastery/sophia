import { nodes } from "../content/knowledge-tree.mjs";

/** Preferred lateral field when children are already filled (must exist on the tree or be added). */
const preferredLateral = {
  mathematics: "statistics",
  finance: "statistics",
  english: "rhetoric",
  claims: "physics",
  physics: "engineering",
  electronics: "engineering",
  chemistry: "medicine",
  biology: "environmentalScience",
  geology: "systems",
  history: "nzHistory",
  politics: "civics",
  technology: "designChoice",
  psychology: "philosophy",
  socialManagement: "managementCore",
  management: "accounting",
  managementCore: "accounting",
};

function nodeForField(fieldId, treeNodes = nodes) {
  return (treeNodes || []).find((node) => node.field === fieldId) || null;
}

function childrenOfNode(nodeId, treeNodes = nodes) {
  return (treeNodes || []).filter((node) => node.parentId === nodeId);
}

function fieldHasItems(fieldId, items, strands) {
  if (!fieldId) return false;
  const strandFields = new Map();
  if (strands && typeof strands === "object" && !Array.isArray(strands)) {
    for (const [id, strand] of Object.entries(strands)) {
      strandFields.set(id, strand.field || null);
    }
  } else {
    for (const strand of strands || []) {
      strandFields.set(strand.id, strand.field || null);
    }
  }
  return (items || []).some((item) => {
    if (item.claim === fieldId) return true;
    const strandField = strandFields.get(item.strandId);
    return strandField === fieldId;
  });
}

/**
 * Pick the lateral field for a held parent field.
 * Prefer an existing child leaf with no items; else preferredLateral; else null.
 */
function lateralFieldFor(fieldId, { items, strands, treeNodes = nodes } = {}) {
  const parent = nodeForField(fieldId, treeNodes);
  if (!parent) {
    const preferred = preferredLateral[fieldId];
    if (preferred && !fieldHasItems(preferred, items, strands)) return preferred;
    return null;
  }

  const kids = childrenOfNode(parent.id, treeNodes)
    .filter((node) => node.field)
    .sort((a, b) => (a.tier - b.tier) || (a.order || 0) - (b.order || 0) || a.id.localeCompare(b.id));

  for (const kid of kids) {
    if (!fieldHasItems(kid.field, items, strands)) return kid.field;
  }

  const preferred = preferredLateral[fieldId];
  if (preferred && preferred !== fieldId && !fieldHasItems(preferred, items, strands)) {
    return preferred;
  }

  return null;
}

function lateralStrandId(parentFieldId, lateralFieldId) {
  return `${parentFieldId}-to-${lateralFieldId}`;
}

function titleForField(fieldId, treeNodes = nodes) {
  const node = nodeForField(fieldId, treeNodes);
  return node?.title || fieldId;
}

export {
  preferredLateral,
  nodeForField,
  fieldHasItems,
  lateralFieldFor,
  lateralStrandId,
  titleForField,
};
