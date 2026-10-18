/** Management 101 Helios walkthrough. Term 4 spine — not a second catalogue. */

import { buildPassage } from "../lib/passage.mjs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const heliosPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "sources", "helios-strategic-execution.md");
const heliosBody = readFileSync(heliosPath, "utf8");

const heliosSource = {
  id: "helios-strategic-execution",
  title: "Strategic execution essay: Helios Energy",
  kind: "essay",
  body: heliosBody,
  file: "sources/helios-strategic-execution.md",
};

const words = {
  pestel: [
    { term: "macro-environment", meaning: "Outside forces that shape a firm but sit beyond its day-to-day control.", example: "A tax credit for solar is in the macro-environment." },
    { term: "PESTEL", meaning: "A scan of Political, Economic, Social, Technological, Environmental, and Legal factors.", example: "A subsidy is Political and often Legal as well." },
  ],
  swot: [
    { term: "strength", meaning: "An internal advantage the firm already has.", example: "A proprietary battery design is a strength." },
    { term: "weakness", meaning: "An internal limit that holds the firm back.", example: "High unit cost is a weakness." },
    { term: "opportunity", meaning: "An external chance the firm can use.", example: "A green tax credit is an opportunity." },
    { term: "threat", meaning: "An external risk that can hurt the firm.", example: "A lithium shortage is a threat." },
  ],
  smart: [
    { term: "SMART goal", meaning: "A goal that is Specific, Measurable, Achievable, Relevant, and Time-bound.", example: "Raise microgrid sales 18% in twelve months." },
  ],
  polc: [
    { term: "POLC", meaning: "Planning, Organising, Leading, and Controlling — how a goal is carried out.", example: "A sales dashboard is Controlling." },
  ],
  lead: [
    { term: "incentive", meaning: "An external reward attached to the job, often pay.", example: "A bonus for hitting the sales target." },
    { term: "intrinsic motivation", meaning: "Wanting the work itself, not only the pay.", example: "Caring about carbon cuts in the region." },
  ],
};

function choice(entry) {
  const item = {
    kind: "probe",
    answerKind: "choice",
    ideaId: entry.id,
    claim: "management",
    strandId: "management-101",
    sourceId: "helios-strategic-execution",
    ...entry,
  };
  if (!Array.isArray(item.passage) || item.passage.length !== 2) {
    item.passage = buildPassage(item);
  }
  if (entry.follow && !item.followPrompt) item.followPrompt = entry.follow;
  if (entry.accept && !item.repairAccept) item.repairAccept = entry.accept;
  return item;
}

const strands = [
  {
    id: "management-101",
    title: "Management 101: Helios walkthrough",
    domain: "management",
    phase: "interest",
    order: 10,
    summary: "PESTEL, SWOT, SMART, and POLC on the Helios essay, then one case of your own. This is practice, not NCEA.",
    depth: 2,
    role: "module",
    ageTier: "year10",
    field: "management",
    continues: "placement-check",
  },
];

const items = [
  choice({
    id: "m101-pestel-letters",
    order: 1,
    words: words.pestel,
    prompt: "Helios must document safety before its arrays may connect to the public grid; a recent court ruling clarified who enforces those hook-up standards. Which PESTEL letter fits that factor best?",
    choices: [
      { id: "legal", text: "Legal — statutes, permits, and court rulings" },
      { id: "social", text: "Social — public attitudes toward clean energy" },
      { id: "economic", text: "Economic — prices, credit, and market demand" },
      { id: "tech", text: "Technological — panels, batteries, and grid gear" },
    ],
    answer: "legal",
    lookFor: ["Legal covers laws, rules, and compliance requirements"],
    misconceptions: ["Putting every rule under Political only"],
    follow: "Name one rule or permit that could affect a solar firm.",
    accept: ["law", "rule", "compliance", "permit", "regulation", "grid"],
  }),
  choice({
    id: "m101-helios-sort",
    order: 2,
    words: words.pestel,
    prompt: "Helios faces \"evolving grid connection compliance laws.\" Which PESTEL letter fits best?",
    choices: [
      { id: "legal", text: "Legal — binding standards for grid connection" },
      { id: "social", text: "Social — how communities view solar installers" },
      { id: "env", text: "Environmental — land use and lifecycle emissions" },
      { id: "econ", text: "Economic — interest rates and project finance" },
    ],
    answer: "legal",
    lookFor: ["Grid connection compliance laws sit under Legal"],
    misconceptions: ["Treating every energy issue as Environmental"],
    follow: "Why keep government policy and statute as two different scan letters?",
    accept: ["policy", "law", "rule", "government", "compliance", "distinct"],
  }),
  choice({
    id: "m101-swot-from-facts",
    order: 3,
    words: words.swot,
    prompt: "Helios has proprietary high-efficiency battery storage. In SWOT, that is mainly a:",
    choices: [
      { id: "strength", text: "Strength — something the firm already owns inside" },
      { id: "opportunity", text: "Opportunity — an outside trend the firm could use" },
      { id: "threat", text: "Threat — an outside force that could harm sales" },
      { id: "weakness", text: "Weakness — an internal gap that slows the firm" },
    ],
    answer: "strength",
    lookFor: ["A proprietary battery is an internal strength"],
    misconceptions: ["Calling every good fact an opportunity"],
    follow: "Is a federal green tax credit inside the firm or outside it? Say which and why it matters for SWOT.",
    accept: ["outside", "external", "tax", "credit", "policy", "opportunity"],
  }),
  choice({
    id: "m101-smart-missing",
    order: 4,
    words: words.smart,
    prompt: "A goal says \"increase microgrid sales in the Southwest\" but gives no number and no date. Which SMART parts are missing?",
    choices: [
      { id: "mt", text: "Measurable and Time-bound" },
      { id: "sr", text: "Specific and Relevant" },
      { id: "all", text: "Achievable and Relevant" },
      { id: "none", text: "Specific and Achievable" },
    ],
    answer: "mt",
    lookFor: ["Without a number and a date, Measurable and Time-bound are missing"],
    misconceptions: ["Assuming a vague goal is already SMART"],
    follow: "Rewrite that goal with one clear number and one finish date.",
    accept: ["%", "percent", "month", "year", "18", "12", "quarter"],
  }),
  choice({
    id: "m101-polc-place",
    order: 5,
    words: words.polc,
    prompt: "Helios builds a dashboard that tracks quarterly sales and shifts marketing funds if a quarter falls short. That action is mainly:",
    choices: [
      { id: "control", text: "Controlling — track results and adjust when targets slip" },
      { id: "plan", text: "Planning — set long-range goals before any action" },
      { id: "org", text: "Organising — assign roles and divide the work" },
      { id: "lead", text: "Leading — motivate the team toward the vision" },
    ],
    answer: "control",
    lookFor: ["A dashboard that corrects course is Controlling"],
    misconceptions: ["Calling every meeting Controlling"],
    follow: "Name one figure a results dashboard might track for Helios.",
    accept: ["sales", "cost", "lead", "volume", "acquisition", "quarter"],
  }),
  choice({
    id: "m101-leading-motive",
    order: 6,
    words: words.lead,
    prompt: "Helios pays bonuses for the 18% target and also talks about regional carbon reduction. Which pair is correct?",
    choices: [
      { id: "both", text: "Pay bonus as incentive; carbon purpose can motivate intrinsically" },
      { id: "same", text: "Both pay and purpose are the same kind of incentive" },
      { id: "only", text: "Only pay rewards count as Leading; talk does not" },
      { id: "none", text: "Neither pay nor purpose belongs under Leading" },
    ],
    answer: "both",
    lookFor: ["Pay is an incentive; purpose can support intrinsic motivation"],
    misconceptions: ["Treating every motive as pay"],
    follow: "In one sentence, tell a pay reward from wanting the work itself.",
    accept: ["pay", "bonus", "want", "purpose", "intrinsic", "reward"],
  }),
  {
    id: "m101-own-case",
    strandId: "management-101",
    ideaId: "m101-own-case",
    kind: "research",
    answerKind: "essay",
    claim: "management",
    order: 7,
    sourceId: "helios-strategic-execution",
    words: [...words.pestel, ...words.swot, ...words.smart, ...words.polc, ...words.lead],
    prompt: "Choose a real organisation you know. Write a short case that uses PESTEL, SWOT, one SMART goal, and POLC. The management words must do real work in your sentences — do not only list headings.",
  },
];

export { strands, items, heliosSource };
