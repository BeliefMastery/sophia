/** University Entrance target register. Seed writes catalog/entrance. */

const options = [
  {
    id: "english",
    title: "English literacy",
    always: true,
    defaultOn: true,
    order: 1,
    nodeIds: ["english"],
  },
  {
    id: "mathematics",
    title: "Mathematics numeracy",
    always: true,
    defaultOn: true,
    order: 2,
    nodeIds: ["mathematics", "finance"],
  },
  {
    id: "science",
    title: "School sciences",
    always: false,
    defaultOn: true,
    order: 3,
    nodeIds: ["science", "claims", "physics", "chemistry", "biology", "geology", "electronics"],
  },
  {
    id: "psychology",
    title: "Psychology",
    always: false,
    defaultOn: true,
    order: 4,
    nodeIds: ["psychology"],
  },
  {
    id: "management",
    title: "Management",
    always: false,
    defaultOn: true,
    order: 5,
    nodeIds: ["managementCore", "socialManagement", "social", "history", "politics", "technology"],
  },
];

function entranceCatalogRecord(list = options) {
  const out = {};
  list.forEach((option, index) => {
    out[option.id] = {
      title: option.title,
      always: option.always === true,
      defaultOn: option.defaultOn === true,
      order: option.order ?? index + 1,
      nodeIds: [...(option.nodeIds || [])],
    };
  });
  return out;
}

function optionsFromCatalog(catalog) {
  const fallback = () => options.map((option) => ({ ...option, nodeIds: [...option.nodeIds] }));
  if (!catalog) return fallback();
  if (Array.isArray(catalog)) {
    if (!catalog.length) return fallback();
    return catalog.map((option, index) => ({
      id: option.id,
      title: option.title,
      always: option.always === true,
      defaultOn: option.defaultOn !== false,
      order: option.order ?? index + 1,
      nodeIds: Array.isArray(option.nodeIds) ? [...option.nodeIds] : [],
    }));
  }
  const entries = Object.entries(catalog);
  if (!entries.length) return fallback();
  return entries
    .map(([id, option]) => ({
      id,
      title: option.title || id,
      always: option.always === true,
      defaultOn: option.defaultOn !== false,
      order: Number(option.order) || 0,
      nodeIds: Array.isArray(option.nodeIds) ? [...option.nodeIds] : [],
    }))
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

/** Effective ticks for the map: always-on forced; defaults apply when nothing is stored yet. */
function effectiveEntrance(record, catalog = options) {
  const listed = optionsFromCatalog(catalog);
  const ticks = record && typeof record === "object" ? record : {};
  const hasAny = listed.some((option) => ticks[option.id] === true);
  const out = {};
  for (const option of listed) {
    if (option.always) out[option.id] = true;
    else if (!hasAny && option.defaultOn) out[option.id] = true;
    else if (ticks[option.id] === true) out[option.id] = true;
  }
  if (ticks.updatedAt) out.updatedAt = ticks.updatedAt;
  return out;
}

function entranceRecordForSave(nextTicks, catalog = options) {
  const listed = optionsFromCatalog(catalog);
  const out = { updatedAt: Date.now() };
  for (const option of listed) {
    if (option.always || nextTicks?.[option.id] === true) out[option.id] = true;
  }
  return out;
}

/** Node ids on the entrance ramp for the selected targets (plus ancestor foundations). */
function visibleEntranceNodeIds(record, catalog = options, treeNodes = []) {
  const effective = effectiveEntrance(record, catalog);
  const listed = optionsFromCatalog(catalog);
  const byId = new Map((treeNodes || []).map((node) => [node.id, node]));
  const ids = new Set();
  for (const option of listed) {
    if (effective[option.id] !== true) continue;
    for (const nodeId of option.nodeIds || []) {
      let current = byId.get(nodeId);
      while (current) {
        if (current.wing !== "additional") ids.add(current.id);
        current = current.parentId ? byId.get(current.parentId) : null;
      }
    }
  }
  return ids;
}

export {
  options,
  entranceCatalogRecord,
  optionsFromCatalog,
  effectiveEntrance,
  entranceRecordForSave,
  visibleEntranceNodeIds,
};
