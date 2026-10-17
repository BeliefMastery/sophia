/** Interest options derived from the knowledge tech-tree. Seed writes catalog/interests. */

import { interestOptionsFromTree, nodes } from "./knowledge-tree.mjs";

const options = interestOptionsFromTree(nodes);

function interestsCatalogRecord(list = options) {
  const out = {};
  list.forEach((option, index) => {
    out[option.id] = {
      title: option.title,
      group: option.group,
      order: option.order ?? index + 1,
    };
  });
  return out;
}

function optionsFromCatalog(catalog) {
  if (!catalog) return [];
  if (Array.isArray(catalog)) {
    return catalog.map((option, index) => ({
      id: option.id,
      title: option.title,
      group: option.group || "Other",
      order: option.order ?? index + 1,
    }));
  }
  return Object.entries(catalog)
    .map(([id, option]) => ({
      id,
      title: option.title,
      group: option.group || "Other",
      order: Number(option.order) || 0,
    }))
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

function tickedInterests(record, catalog) {
  const listed = optionsFromCatalog(catalog);
  const ticks = record && typeof record === "object" ? record : {};
  return listed.filter((option) => ticks[option.id] === true);
}

export { options, interestsCatalogRecord, optionsFromCatalog, tickedInterests };
