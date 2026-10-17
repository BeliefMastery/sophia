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
    summary: "Number, algebra, and core methods that deepen toward university.",
  },
  {
    id: "english",
    title: "English",
    field: "english",
    parentId: null,
    tier: 0,
    status: "live",
    summary: "Reading, writing, language, and literature.",
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
    summary: "Psychology, philosophy, and human inquiry.",
  },
  {
    id: "commerce",
    title: "Commerce",
    field: null,
    parentId: null,
    tier: 0,
    status: "live",
    summary: "Business, accounting, marketing, and management.",
  },
  {
    id: "applied",
    title: "Applied fields",
    field: null,
    parentId: null,
    tier: 0,
    status: "live",
    summary: "Law, design, computing, AI literacy, and architecture.",
  },

  // Mathematics
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
    status: "live",
    summary: "Data, chance, and careful claims. Year 11 gateway toward university statistics.",
  },

  // English
  {
    id: "literature",
    title: "Literature",
    field: "literature",
    parentId: "english",
    tier: 1,
    status: "live",
    summary: "Narrator, theme, and evidence from text. Year 11 gateway toward university literature.",
  },
  {
    id: "linguistics",
    title: "Linguistics",
    field: "linguistics",
    parentId: "english",
    tier: 1,
    status: "live",
    summary: "Form, meaning, and register. Year 11 gateway toward university linguistics.",
  },

  // Science
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

  // Social
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

  // Mind
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
    status: "live",
    summary: "Argument, ethics, and careful questions. Year 11 gateway toward university philosophy.",
  },
  {
    id: "sociology",
    title: "Sociology",
    field: "sociology",
    parentId: "mind",
    tier: 1,
    status: "live",
    summary: "Groups, norms, and social structure. Year 11 gateway toward university sociology.",
  },
  {
    id: "anthropology",
    title: "Anthropology",
    field: "anthropology",
    parentId: "mind",
    tier: 1,
    status: "live",
    summary: "Culture, meaning, and human difference. Year 11 gateway toward university anthropology.",
  },

  // Commerce
  {
    id: "accounting",
    title: "Accounting",
    field: "accounting",
    parentId: "commerce",
    tier: 1,
    status: "live",
    summary: "Assets, liabilities, and a simple profit idea. Year 11 gateway toward university accounting.",
  },
  {
    id: "marketing",
    title: "Marketing",
    field: "marketing",
    parentId: "commerce",
    tier: 1,
    status: "live",
    summary: "Customer need, offer, and channel. Year 11 gateway toward university marketing.",
  },
  {
    id: "managementCore",
    title: "Management",
    field: "management",
    parentId: "commerce",
    tier: 1,
    status: "live",
    summary: "Goal, plan, organise, lead, and control. Year 11 gateway toward university management.",
  },
  {
    id: "business",
    title: "Business",
    field: "business",
    parentId: "commerce",
    tier: 1,
    status: "live",
    summary: "Firm, customer, cost, and competition. Year 11 gateway toward university business.",
  },

  // Applied
  {
    id: "design",
    title: "Design",
    field: "design",
    parentId: "applied",
    tier: 1,
    status: "live",
    summary: "Brief, user, prototype, and test. Year 11 gateway toward university design.",
  },
  {
    id: "law",
    title: "Law",
    field: "law",
    parentId: "applied",
    tier: 1,
    status: "live",
    summary: "Rules, rights, and fair process. Year 11 gateway toward university law.",
  },
  {
    id: "aiLiteracy",
    title: "AI literacy",
    field: "aiLiteracy",
    parentId: "applied",
    tier: 1,
    status: "live",
    summary: "Models, data, limits, and human checks. Year 11 gateway toward applied AI study.",
  },
  {
    id: "computerScience",
    title: "Computer science",
    field: "computerScience",
    parentId: "applied",
    tier: 1,
    status: "live",
    summary: "Algorithms, data, and clear steps. Year 11 gateway toward university computer science.",
  },
  {
    id: "architecture",
    title: "Architecture",
    field: "architecture",
    parentId: "applied",
    tier: 1,
    status: "live",
    summary: "Space, structure, light, and site. Year 11 gateway toward university architecture.",
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
