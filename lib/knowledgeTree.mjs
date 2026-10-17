import { nodesFromCatalog } from "../content/knowledge-tree.mjs";

function fieldById(fields) {
  const map = new Map();
  for (const field of fields || []) map.set(field.id, field);
  return map;
}

function nodeMap(nodes) {
  const map = new Map();
  for (const node of nodes) map.set(node.id, node);
  return map;
}

function hasLiveContent(node, fields) {
  if (!node?.field) return false;
  const field = fields.get(node.field);
  return Boolean(field && field.total > 0);
}

function isContainer(node) {
  return !node.field;
}

function prereqComplete(node, byId, fields) {
  if (!node.parentId) return true;
  const parent = byId.get(node.parentId);
  if (!parent) return false;
  if (isContainer(parent)) return true;
  if (!hasLiveContent(parent, fields)) return true;
  return fields.get(parent.field)?.complete === true;
}

function evaluateNode(node, byId, fields) {
  if (isContainer(node)) {
    return {
      ...node,
      state: "open",
      studyable: false,
      reason: "This is a domain map. Open a branch beneath it.",
      progress: null,
    };
  }

  const field = fields.get(node.field);
  const noContent = !field || field.total <= 0;
  if (node.status === "planned" || noContent) {
    return {
      ...node,
      state: "planned",
      studyable: false,
      reason: "Not written yet. You can mark it as an interest.",
      progress: null,
    };
  }

  if (!prereqComplete(node, byId, fields)) {
    const parent = byId.get(node.parentId);
    return {
      ...node,
      state: "locked",
      studyable: false,
      reason: parent
        ? `Finish ${parent.title} first.`
        : "Finish the previous field first.",
      progress: {
        answered: field.answered,
        total: field.total,
        depth: field.depth,
        label: field.label,
        complete: field.complete,
      },
    };
  }

  if (field.complete) {
    return {
      ...node,
      state: "complete",
      studyable: true,
      reason: "Section finished. A new cluster may be added later.",
      progress: {
        answered: field.answered,
        total: field.total,
        depth: field.depth,
        label: field.label,
        complete: true,
      },
    };
  }

  if (field.answered > 0) {
    return {
      ...node,
      state: "active",
      studyable: true,
      reason: "In progress.",
      progress: {
        answered: field.answered,
        total: field.total,
        depth: field.depth,
        label: field.label,
        complete: false,
      },
    };
  }

  return {
    ...node,
    state: "open",
    studyable: true,
    reason: "Ready to study.",
    progress: {
      answered: field.answered,
      total: field.total,
      depth: field.depth,
      label: field.label,
      complete: false,
    },
  };
}

function evaluateTree(catalogOrNodes, fieldsList) {
  const nodes = Array.isArray(catalogOrNodes)
    ? catalogOrNodes
    : nodesFromCatalog(catalogOrNodes);
  const fields = fieldById(fieldsList);
  const byId = nodeMap(nodes);
  return nodes.map((node) => evaluateNode(node, byId, fields));
}

function nodesByTier(evaluated) {
  const tiers = new Map();
  for (const node of evaluated) {
    const list = tiers.get(node.tier) || [];
    list.push(node);
    tiers.set(node.tier, list);
  }
  return [...tiers.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([tier, list]) => ({
      tier,
      nodes: list.sort((a, b) => (a.order || 0) - (b.order || 0) || a.title.localeCompare(b.title)),
    }));
}

function childrenOf(evaluated, parentId) {
  return evaluated.filter((node) => node.parentId === parentId);
}

export {
  evaluateTree,
  evaluateNode,
  nodesByTier,
  childrenOf,
  hasLiveContent,
  prereqComplete,
};
