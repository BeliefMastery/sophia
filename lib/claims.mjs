const claims = [
  {
    id: "mathematics",
    title: "Mathematics",
    assessment: "Year 10 Start Right project book complete",
    validated: "Validated. The Year 10 mathematics in this check still holds.",
    ahead: "Invalidated. These answers are stronger than a book that had slipped.",
    behind: "Invalidated. The completed book is not holding on these questions.",
    mixed: "Invalidated. The mathematics answers do not sit cleanly against the note.",
  },
  {
    id: "english",
    title: "English",
    assessment: "Halfway through Year 10 Start Right",
    validated: "Validated. Earlier Year 10 reading held, and the later language question did not.",
    ahead: "Invalidated. She also handled the later language question, so halfway is too low.",
    behind: "Invalidated. Earlier Year 10 questions did not hold, so halfway is too high.",
    mixed: "Invalidated. Some earlier skills slipped, and a later one was already there.",
  },
  {
    id: "physics",
    title: "Physics",
    assessment: "Extremely poor",
    validated: "Validated. Physics still looks extremely weak on these questions.",
    ahead: "Invalidated. She answered basic physics correctly, so extremely poor is too low.",
    behind: "Invalidated. The physics answers do not fit the note.",
    mixed: "Invalidated. The physics answers do not sit cleanly against the note.",
  },
  {
    id: "chemistry",
    title: "Chemistry",
    assessment: "pH and basic ion behaviour only",
    validated: "Validated. pH and ions held, and the mole question beyond that note did not.",
    ahead: "Invalidated. She also handled the mole question, so the note is too low.",
    behind: "Invalidated. pH or ions did not hold, so the note is too high.",
    mixed: "Invalidated. Part of the pH and ion note slipped, and the later question was already there.",
  },
  {
    id: "biology",
    title: "Biology",
    assessment: "Very poor",
    validated: "Validated. Biology still looks very weak on these questions.",
    ahead: "Invalidated. She answered basic cell questions correctly, so very poor is too low.",
    behind: "Invalidated. The biology answers do not fit the note.",
    mixed: "Invalidated. The biology answers do not sit cleanly against the note.",
  },
  {
    id: "geology",
    title: "Geology",
    assessment: "Very poor",
    validated: "Validated. Geology still looks very weak on these questions.",
    ahead: "Invalidated. She answered basic earth-science questions correctly, so very poor is too low.",
    behind: "Invalidated. The geology answers do not fit the note.",
    mixed: "Invalidated. The geology answers do not sit cleanly against the note.",
  },
  {
    id: "history",
    title: "History",
    assessment: "Poor",
    validated: "Validated. History still looks weak on these questions.",
    ahead: "Invalidated. She answered basic history questions correctly, so poor is too low.",
    behind: "Invalidated. The history answers do not fit the note.",
    mixed: "Invalidated. The history answers do not sit cleanly against the note.",
  },
  {
    id: "politics",
    title: "Politics",
    assessment: "Poor",
    validated: "Validated. Politics still looks weak on these questions.",
    ahead: "Invalidated. She answered basic politics questions correctly, so poor is too low.",
    behind: "Invalidated. The politics answers do not fit the note.",
    mixed: "Invalidated. The politics answers do not sit cleanly against the note.",
  },
  {
    id: "technology",
    title: "Technology",
    assessment: "Poor",
    validated: "Validated. Technology, as a social study, still looks weak on these questions.",
    ahead: "Invalidated. She answered basic technology questions correctly, so poor is too low.",
    behind: "Invalidated. The technology answers do not fit the note.",
    mixed: "Invalidated. The technology answers do not sit cleanly against the note.",
  },
  {
    id: "psychology",
    title: "Psychology",
    assessment: "Advanced",
    validated: "Validated. The psychology note holds: she read the situations.",
    ahead: "Invalidated. These answers are stronger than the note.",
    behind: "Invalidated. The situations were not read as an advanced note would expect.",
    mixed: "Invalidated. The psychology answers do not sit cleanly against the note.",
  },
  {
    id: "socialManagement",
    title: "Social management",
    assessment: "Advanced",
    validated: "Validated. The social management note holds: she read the room and the goal.",
    ahead: "Invalidated. These answers are stronger than the note.",
    behind: "Invalidated. The situations were not read as an advanced note would expect.",
    mixed: "Invalidated. The social management answers do not sit cleanly against the note.",
  },
];

function followsPredict(row) {
  return row.predict === "known" ? row.matched === true : row.matched === false;
}

function judgeClaim(claim, rows) {
  const support = rows.filter(followsPredict);
  const ahead = rows.filter((row) => row.predict === "unknown" && row.matched === true);
  const behind = rows.filter((row) => row.predict === "known" && row.matched === false);
  const predicts = new Set(rows.map((row) => row.predict));
  const exact = predicts.has("known") && predicts.has("unknown");
  const validated = rows.length > 0 && (exact ? support.length === rows.length : support.length * 2 > rows.length);
  let direction = "validated";
  if (!validated) {
    if (ahead.length > 0 && behind.length > 0) direction = "mixed";
    else if (ahead.length > 0) direction = "ahead";
    else direction = "behind";
  }
  let text = validated ? claim.validated : claim[direction];
  if (validated && ahead.length + behind.length > 0) {
    text += ` ${ahead.length + behind.length} of ${rows.length} answers did not fit the note.`;
  }
  return {
    claimId: claim.id,
    title: claim.title,
    assessment: claim.assessment,
    validated,
    direction: validated ? "validated" : direction,
    support: support.length,
    total: rows.length,
    text,
  };
}

function judgePlacement(claimList, rowsByClaim) {
  return claimList.map((claim) => judgeClaim(claim, rowsByClaim.get(claim.id) || []));
}

export { claims, followsPredict, judgeClaim, judgePlacement };
