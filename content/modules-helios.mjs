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
    { term: "macro-environment", meaning: "The big outside forces, such as laws, the economy, and new technology, that affect a business but that the business cannot control from day to day.", example: "A government tax credit for solar power is part of the macro-environment." },
    { term: "PESTEL", meaning: "A checklist for scanning the outside world. It covers Political, Economic, Social, Technological, Environmental, and Legal factors.", example: "A government subsidy (money that helps an industry) is Political, and it can also be Legal if it is written into a law." },
  ],
  swot: [
    { term: "strength", meaning: "Something inside the firm that it already has or does well.", example: "Helios owns a special battery design, which is a strength." },
    { term: "weakness", meaning: "Something inside the firm that holds it back.", example: "Helios's products cost more to make than its older rivals' products, which is a weakness." },
    { term: "opportunity", meaning: "A chance that comes from outside the firm and that the firm could use.", example: "A government tax credit for green energy makes solar power cheaper for buyers, which is an opportunity." },
    { term: "threat", meaning: "Something outside the firm that could hurt it.", example: "A world shortage of lithium (a metal used in batteries) makes materials harder to get, which is a threat." },
  ],
  smart: [
    { term: "SMART goal", meaning: "A goal that is Specific (clear), Measurable (it has a number), Achievable (realistic), Relevant (it matters to the firm), and Time-bound (it has a deadline).", example: "Increase microgrid sales by 18% in the next 12 months." },
  ],
  polc: [
    { term: "POLC", meaning: "The four jobs a manager does to turn a goal into action: Planning, Organising, Leading, and Controlling.", example: "A dashboard that shows sales each quarter is an example of Controlling." },
  ],
  lead: [
    { term: "incentive", meaning: "A reward from outside, such as a bonus, that a person is given for doing a job well.", example: "A bonus for reaching the sales target." },
    { term: "intrinsic motivation", meaning: "Wanting to do the work because you care about it, and not only because of the pay.", example: "Caring about cutting carbon pollution in the region." },
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
    summary: "You use four management tools (PESTEL, SWOT, SMART goals, and POLC) on the Helios essay, and then use them on a case of your own. This is practice, not NCEA.",
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
    prompt: "Helios has to show that its solar panel systems are safe before they can be connected to the public power grid, and a recent court ruling made clear who enforces the connection standards. A PESTEL scan sorts outside forces into Political, Economic, Social, Technological, Environmental, and Legal factors. Which PESTEL letter fits this factor best?",
    choices: [
      { id: "legal", text: "Legal: laws, permits, and court rulings that the firm has to follow" },
      { id: "social", text: "Social: how the public feels about clean energy" },
      { id: "economic", text: "Economic: prices, loans, and how much people want to buy" },
      { id: "tech", text: "Technological: the panels, batteries, and equipment used on the grid" },
    ],
    answer: "legal",
    lookFor: ["Legal covers the laws, rules, and compliance requirements that a firm must meet, such as safety standards and permits."],
    misconceptions: ["Some people put every rule under Political, but rules that are written into law and enforced by courts belong under Legal."],
    follow: "Name one rule or permit that could affect a solar firm.",
    accept: ["law", "rule", "compliance", "permit", "regulation", "grid"],
  }),
  choice({
    id: "m101-helios-sort",
    order: 2,
    words: words.pestel,
    prompt: "The Helios essay says the firm faces \"evolving grid connection compliance laws\". This means the laws about connecting to the power grid keep changing. Which PESTEL letter fits this best?",
    choices: [
      { id: "legal", text: "Legal: binding standards that Helios must meet to connect to the grid" },
      { id: "social", text: "Social: how communities feel about solar installers" },
      { id: "env", text: "Environmental: how land is used and the pollution released over a product's life" },
      { id: "econ", text: "Economic: interest rates and the cost of paying for projects" },
    ],
    answer: "legal",
    lookFor: ["Laws about connecting to the grid are rules that the law requires a firm to follow, so they sit under Legal."],
    misconceptions: ["Some people file every energy issue under Environmental, but a rule that firms must follow by law is a Legal factor."],
    follow: "Government policy and the law are two different PESTEL letters. Why is it useful to keep them separate?",
    accept: ["policy", "law", "rule", "government", "compliance", "distinct"],
  }),
  choice({
    id: "m101-swot-from-facts",
    order: 3,
    words: words.swot,
    prompt: "In a SWOT analysis, Strengths and Weaknesses are things inside the firm, and Opportunities and Threats come from outside the firm. Helios owns a special high-efficiency battery design that other firms cannot copy. Which SWOT box does this belong in?",
    choices: [
      { id: "strength", text: "Strength: something good that the firm already has inside the business" },
      { id: "opportunity", text: "Opportunity: an outside trend that the firm could take advantage of" },
      { id: "threat", text: "Threat: an outside force that could hurt the firm's sales" },
      { id: "weakness", text: "Weakness: something inside the firm that holds it back" },
    ],
    answer: "strength",
    lookFor: ["In a SWOT analysis, things that the firm already owns or does well, such as its own technology, are strengths."],
    misconceptions: ["Some people call every good fact an opportunity, but an opportunity has to come from outside the firm."],
    follow: "Is a government green tax credit inside the firm or outside it? Say which, and explain why that matters for SWOT.",
    accept: ["outside", "external", "tax", "credit", "policy", "opportunity"],
  }),
  choice({
    id: "m101-smart-missing",
    order: 4,
    words: words.smart,
    prompt: "A goal says \"increase microgrid sales in the Southwest\" (a microgrid is a small local power network), but it gives no number and no deadline. A SMART goal is Specific, Measurable, Achievable, Relevant, and Time-bound. Which two SMART parts are missing from this goal?",
    choices: [
      { id: "mt", text: "Measurable (it has a number) and Time-bound (it has a deadline)" },
      { id: "sr", text: "Specific (it names a clear target) and Relevant (it fits the firm's aims)" },
      { id: "all", text: "Achievable (it is realistic) and Relevant (it fits the firm's aims)" },
      { id: "none", text: "Specific (it names a clear target) and Achievable (it is realistic)" },
    ],
    answer: "mt",
    lookFor: ["A goal with no number cannot be measured, and a goal with no deadline has no time limit. Those are the two parts that are missing here."],
    misconceptions: ["Some people assume that a vague goal already counts as a SMART goal."],
    follow: "Rewrite that goal with one clear number and one finish date.",
    accept: ["%", "percent", "month", "year", "18", "12", "quarter"],
  }),
  choice({
    id: "m101-polc-place",
    order: 5,
    words: words.polc,
    prompt: "Helios builds a dashboard (a screen of key numbers) that tracks sales each quarter, and it moves marketing money to where it is needed if a quarter falls short. POLC stands for Planning, Organising, Leading, and Controlling. Which part of POLC is this action?",
    choices: [
      { id: "control", text: "Controlling: checking the results and making changes when targets are missed" },
      { id: "plan", text: "Planning: setting long-term goals before any action starts" },
      { id: "org", text: "Organising: giving people roles and splitting up the work" },
      { id: "lead", text: "Leading: motivating the team to work toward the vision" },
    ],
    answer: "control",
    lookFor: ["A tool that checks results against targets, and then changes course when things go off track, is an example of controlling."],
    misconceptions: ["Some people call every meeting controlling, but controlling is specifically about checking results and correcting course."],
    follow: "Name one figure that a results dashboard might track for Helios.",
    accept: ["sales", "cost", "lead", "volume", "acquisition", "quarter"],
  }),
  choice({
    id: "m101-leading-motive",
    order: 6,
    words: words.lead,
    prompt: "Helios pays bonuses to people who help reach the 18% sales target, and its managers also talk about how the work helps cut carbon pollution in the region. An incentive is a reward from outside, such as pay. Intrinsic motivation means wanting to do the work for its own sake. Which statement is correct?",
    choices: [
      { id: "both", text: "The bonus is an incentive, while caring about cutting carbon can motivate from within" },
      { id: "same", text: "Pay and purpose are both exactly the same kind of incentive for people" },
      { id: "only", text: "Only pay counts as Leading, and talking about purpose does not help" },
      { id: "none", text: "Neither pay nor purpose has anything at all to do with the skill of Leading" },
    ],
    answer: "both",
    lookFor: ["Money paid for hitting a target is a reward from outside, while caring about the purpose of the work is a motivation that comes from inside a person."],
    misconceptions: ["Some people assume that every reason for working is about pay."],
    follow: "In one sentence, explain the difference between a pay reward and wanting to do the work itself.",
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
    prompt: "Choose a real organisation that you know well, such as a school, a sports club, or a local shop. Write a short case study about it that uses all four tools: PESTEL (outside forces), SWOT (strengths, weaknesses, opportunities, and threats), one SMART goal, and POLC (planning, organising, leading, and controlling). Use each tool to say something real about your organisation. Do not just list the headings.",
  },
];

export { strands, items, heliosSource };
