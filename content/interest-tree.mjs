/** Curated interest checkbox options. Seed writes catalog/interests. Register only; does not create modules. */

const options = [
  { id: "mathematics", title: "Mathematics", group: "School" },
  { id: "english", title: "English", group: "School" },
  { id: "physics", title: "Physics", group: "School" },
  { id: "chemistry", title: "Chemistry", group: "School" },
  { id: "biology", title: "Biology", group: "School" },
  { id: "geology", title: "Geology", group: "School" },
  { id: "history", title: "History", group: "School" },
  { id: "politics", title: "Politics", group: "School" },
  { id: "technology", title: "Technology", group: "School" },
  { id: "psychology", title: "Psychology", group: "School" },
  { id: "socialManagement", title: "Social management", group: "School" },
  { id: "electronics", title: "Electronics", group: "School" },
  { id: "economics", title: "Economics", group: "School" },
  { id: "finance", title: "Finance", group: "School" },
  { id: "management", title: "Management", group: "School" },
  { id: "philosophy", title: "Philosophy", group: "University" },
  { id: "design", title: "Design", group: "University" },
  { id: "literature", title: "Literature", group: "University" },
  { id: "linguistics", title: "Linguistics", group: "University" },
  { id: "sociology", title: "Sociology", group: "University" },
  { id: "anthropology", title: "Anthropology", group: "University" },
  { id: "computerScience", title: "Computer science", group: "University" },
  { id: "engineering", title: "Engineering", group: "University" },
  { id: "architecture", title: "Architecture", group: "University" },
  { id: "law", title: "Law", group: "University" },
  { id: "medicine", title: "Medicine", group: "University" },
  { id: "environmentalScience", title: "Environmental science", group: "University" },
  { id: "aiLiteracy", title: "AI literacy", group: "University" },
];

function interestsCatalogRecord(list = options) {
  const out = {};
  list.forEach((option, index) => {
    out[option.id] = {
      title: option.title,
      group: option.group,
      order: index + 1,
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
