/** Knowledge tech-tree. Seed writes catalog/tree. Interest options derive from nodes. */

const nodes = [
  // Domain roots
  {
    id: "mathematics",
    title: "Mathematics",
    field: "mathematics",
    parentId: null,
    tier: 0,
    status: "live",
    summary: "Number, algebra, and core Year 10 methods.",
  },
  {
    id: "english",
    title: "English",
    field: "english",
    parentId: null,
    tier: 0,
    status: "live",
    summary: "Reading, writing, and language control.",
  },
  {
    id: "science",
    title: "Science",
    field: null,
    parentId: null,
    tier: 0,
    status: "live",
    summary: "Claims, physical sciences, and living systems.",
  },
  {
    id: "social",
    title: "Social studies",
    field: null,
    parentId: null,
    tier: 0,
    status: "live",
    summary: "History, politics, technology, and economics.",
  },
  {
    id: "mind",
    title: "Mind and people",
    field: null,
    parentId: null,
    tier: 0,
    status: "live",
    summary: "Psychology, social skill, and human inquiry.",
  },
  {
    id: "management",
    title: "Management",
    field: null,
    parentId: null,
    tier: 0,
    status: "live",
    summary: "Organisation, design, and applied systems.",
  },

  // Mathematics branches
  {
    id: "finance",
    title: "Finance",
    field: "finance",
    parentId: "mathematics",
    tier: 1,
    status: "live",
    summary: "Money sense that builds on core mathematics.",
  },
  {
    id: "statistics",
    title: "Statistics",
    field: "statistics",
    parentId: "mathematics",
    tier: 1,
    status: "planned",
    summary: "Data, chance, and reading results.",
  },

  // English branches
  {
    id: "literature",
    title: "Literature",
    field: "literature",
    parentId: "english",
    tier: 1,
    status: "planned",
    summary: "Longer texts and literary method.",
  },
  {
    id: "linguistics",
    title: "Linguistics",
    field: "linguistics",
    parentId: "english",
    tier: 1,
    status: "planned",
    summary: "How language is built and used.",
  },

  // Science children (domain container does not block)
  {
    id: "claims",
    title: "Claims and evidence",
    field: "claims",
    parentId: "science",
    tier: 1,
    status: "live",
    summary: "What counts as a claim and what supports it.",
  },
  {
    id: "physics",
    title: "Physics",
    field: "physics",
    parentId: "science",
    tier: 1,
    status: "live",
    summary: "Forces, energy, and physical change.",
  },
  {
    id: "chemistry",
    title: "Chemistry",
    field: "chemistry",
    parentId: "science",
    tier: 1,
    status: "live",
    summary: "Particles, reactions, and materials.",
  },
  {
    id: "biology",
    title: "Biology",
    field: "biology",
    parentId: "science",
    tier: 1,
    status: "live",
    summary: "Cells, living systems, and ecology.",
  },
  {
    id: "geology",
    title: "Geology",
    field: "geology",
    parentId: "science",
    tier: 1,
    status: "live",
    summary: "Earth materials, hazards, and landscapes.",
  },
  {
    id: "electronics",
    title: "Electronics",
    field: "electronics",
    parentId: "physics",
    tier: 2,
    status: "live",
    summary: "Circuits and components after basic physics.",
  },
  {
    id: "engineering",
    title: "Engineering",
    field: "engineering",
    parentId: "physics",
    tier: 2,
    status: "planned",
    summary: "Designing solutions with physical constraints.",
  },
  {
    id: "medicine",
    title: "Medicine",
    field: "medicine",
    parentId: "chemistry",
    tier: 2,
    status: "planned",
    summary: "Body systems and applied chemistry for health.",
  },
  {
    id: "environmentalScience",
    title: "Environmental science",
    field: "environmentalScience",
    parentId: "biology",
    tier: 2,
    status: "planned",
    summary: "Living systems under environmental pressure.",
  },
  {
    id: "systems",
    title: "Systems thinking",
    field: "systems",
    parentId: "geology",
    tier: 2,
    status: "planned",
    summary: "Earth and human systems as linked wholes.",
  },

  // Social children
  {
    id: "history",
    title: "History",
    field: "history",
    parentId: "social",
    tier: 1,
    status: "live",
    summary: "Core NZ and global anchors.",
  },
  {
    id: "politics",
    title: "Politics",
    field: "politics",
    parentId: "social",
    tier: 1,
    status: "live",
    summary: "Power, institutions, and civic process.",
  },
  {
    id: "technology",
    title: "Technology",
    field: "technology",
    parentId: "social",
    tier: 1,
    status: "live",
    summary: "Tools, design choices, and social effects.",
  },
  {
    id: "economics",
    title: "Economics",
    field: "economics",
    parentId: "social",
    tier: 1,
    status: "live",
    summary: "Scarce resources and trade-offs.",
  },
  {
    id: "nzHistory",
    title: "Aotearoa history",
    field: "nzHistory",
    parentId: "history",
    tier: 2,
    status: "planned",
    summary: "Deeper NZ strand after the core anchors.",
  },
  {
    id: "worldHistory",
    title: "World history",
    field: "worldHistory",
    parentId: "history",
    tier: 2,
    status: "planned",
    summary: "Comparative global strand after the core anchors.",
  },

  // Mind children
  {
    id: "psychology",
    title: "Psychology",
    field: "psychology",
    parentId: "mind",
    tier: 1,
    status: "live",
    summary: "Reading situations and inner process.",
  },
  {
    id: "socialManagement",
    title: "Social management",
    field: "socialManagement",
    parentId: "mind",
    tier: 1,
    status: "live",
    summary: "Reading the room and the goal.",
  },
  {
    id: "philosophy",
    title: "Philosophy",
    field: "philosophy",
    parentId: "mind",
    tier: 1,
    status: "planned",
    summary: "Argument, ethics, and careful questions.",
  },
  {
    id: "sociology",
    title: "Sociology",
    field: "sociology",
    parentId: "mind",
    tier: 1,
    status: "planned",
    summary: "Groups, norms, and social structure.",
  },
  {
    id: "anthropology",
    title: "Anthropology",
    field: "anthropology",
    parentId: "mind",
    tier: 1,
    status: "planned",
    summary: "Culture, meaning, and human difference.",
  },

  // Management children
  {
    id: "managementCore",
    title: "Management practice",
    field: "management",
    parentId: "management",
    tier: 1,
    status: "planned",
    summary: "PESTEL, SWOT, and organised action.",
  },
  {
    id: "design",
    title: "Design",
    field: "design",
    parentId: "management",
    tier: 1,
    status: "planned",
    summary: "Briefs, users, and made things.",
  },
  {
    id: "law",
    title: "Law",
    field: "law",
    parentId: "management",
    tier: 1,
    status: "planned",
    summary: "Rules, rights, and institutions.",
  },
  {
    id: "aiLiteracy",
    title: "AI literacy",
    field: "aiLiteracy",
    parentId: "management",
    tier: 1,
    status: "planned",
    summary: "What AI systems can and cannot do.",
  },
  {
    id: "computerScience",
    title: "Computer science",
    field: "computerScience",
    parentId: "management",
    tier: 1,
    status: "planned",
    summary: "Computation, data, and building logic.",
  },
  {
    id: "architecture",
    title: "Architecture",
    field: "architecture",
    parentId: "management",
    tier: 1,
    status: "planned",
    summary: "Space, structure, and built form.",
  },
];

function treeCatalogRecord(list = nodes) {
  const out = {};
  list.forEach((node, index) => {
    out[node.id] = {
      title: node.title,
      field: node.field,
      parentId: node.parentId,
      tier: node.tier,
      status: node.status,
      summary: node.summary,
      order: index + 1,
    };
  });
  return out;
}

function nodesFromCatalog(catalog) {
  if (!catalog) return [];
  if (Array.isArray(catalog)) return catalog.map((node, index) => ({ ...node, order: node.order ?? index + 1 }));
  return Object.entries(catalog)
    .map(([id, node]) => ({
      id,
      title: node.title,
      field: node.field ?? null,
      parentId: node.parentId ?? null,
      tier: Number(node.tier) || 0,
      status: node.status === "planned" ? "planned" : "live",
      summary: node.summary || "",
      order: Number(node.order) || 0,
    }))
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

function interestOptionsFromTree(list = nodes) {
  return list
    .filter((node) => node.field || node.status === "planned")
    .filter((node) => node.field !== null || node.status === "planned")
    .map((node, index) => ({
      id: node.field || node.id,
      title: node.title,
      group: node.parentId ? nodeIdGroup(node, list) : node.title,
      order: index + 1,
    }));
}

function nodeIdGroup(node, list) {
  let current = node;
  while (current?.parentId) {
    current = list.find((entry) => entry.id === current.parentId);
  }
  return current?.title || "Other";
}

export { nodes, treeCatalogRecord, nodesFromCatalog, interestOptionsFromTree };
