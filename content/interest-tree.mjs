/** Curated domain → subfield catalog. Edit here; seed writes catalog/domains. */

const domains = [
  {
    id: "mathematics",
    title: "Mathematics",
    subfields: [
      { id: "mathematics", title: "Mathematics", field: "mathematics" },
      { id: "finance", title: "Finance", field: "finance" },
    ],
  },
  {
    id: "english",
    title: "English",
    subfields: [
      { id: "english", title: "English", field: "english" },
    ],
  },
  {
    id: "science",
    title: "Science",
    subfields: [
      { id: "physics", title: "Physics", field: "physics" },
      { id: "chemistry", title: "Chemistry", field: "chemistry" },
      { id: "biology", title: "Biology", field: "biology" },
      { id: "geology", title: "Geology", field: "geology" },
      { id: "electronics", title: "Electronics", field: "electronics" },
      { id: "systems", title: "Systems thinking", field: "systems" },
    ],
  },
  {
    id: "social",
    title: "Social studies",
    subfields: [
      { id: "history", title: "History", field: "history" },
      { id: "politics", title: "Politics", field: "politics" },
      { id: "technology", title: "Technology", field: "technology" },
      { id: "economics", title: "Economics", field: "economics" },
    ],
  },
  {
    id: "mind",
    title: "Mind and people",
    subfields: [
      { id: "psychology", title: "Psychology", field: "psychology" },
      { id: "socialManagement", title: "Social management", field: "socialManagement" },
      { id: "claims", title: "Claims and evidence", field: "claims" },
    ],
  },
  {
    id: "management",
    title: "Management",
    subfields: [
      { id: "management", title: "Management", field: "management" },
      { id: "aiLiteracy", title: "AI literacy", field: "aiLiteracy" },
    ],
  },
];

function catalogRecord(list = domains) {
  const out = {};
  list.forEach((domain, domainIndex) => {
    const subfields = {};
    domain.subfields.forEach((subfield, subIndex) => {
      subfields[subfield.id] = {
        title: subfield.title,
        field: subfield.field,
        order: subIndex + 1,
      };
    });
    out[domain.id] = {
      title: domain.title,
      order: domainIndex + 1,
      subfields,
    };
  });
  return out;
}

function domainsFromCatalog(catalog) {
  if (!catalog) return [];
  if (Array.isArray(catalog)) {
    return catalog.map((domain, domainIndex) => ({
      id: domain.id,
      title: domain.title,
      order: domain.order ?? domainIndex + 1,
      subfields: (domain.subfields || []).map((subfield, subIndex) => ({
        id: subfield.id,
        title: subfield.title,
        field: subfield.field,
        order: subfield.order ?? subIndex + 1,
      })),
    }));
  }
  return Object.entries(catalog)
    .map(([id, domain]) => ({
      id,
      title: domain.title,
      order: Number(domain.order) || 0,
      subfields: Object.entries(domain.subfields || {})
        .map(([subId, subfield]) => ({
          id: subId,
          title: subfield.title,
          field: subfield.field,
          order: Number(subfield.order) || 0,
        }))
        .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)),
    }))
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

function findSubfield(domainList, domainId, subfieldId) {
  const domain = (domainList || []).find((entry) => entry.id === domainId);
  if (!domain) return null;
  return domain.subfields.find((entry) => entry.id === subfieldId) || null;
}

export { domains, catalogRecord, domainsFromCatalog, findSubfield };
