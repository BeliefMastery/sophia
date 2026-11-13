import { useMemo, useState } from "react";

const standardMappings = [
  {
    domain: "Commerce & Management",
    modules: "Management 101, Helios Strategic Execution, PESTEL Analysis",
    nceaLevel: "Level 1 & Level 3",
    standards: [
      { code: "AS90837", level: "L1", credits: 4, title: "Demonstrate understanding of internal features of a small business" },
      { code: "AS90838", level: "L1", credits: 4, title: "Demonstrate understanding of external factors influencing a small business" },
      { code: "AS91379", level: "L3", credits: 4, title: "Demonstrate understanding of how internal factors interact in a business operating in a global context (UE Approved)" },
      { code: "AS91380", level: "L3", credits: 4, title: "Demonstrate understanding of strategic response to external factors (UE Approved)" },
    ],
  },
  {
    domain: "English & Literacy",
    modules: "English Year 10 Start Right, Essay Arguments, Inference",
    nceaLevel: "Literacy Co-req & Level 2 UE Literacy",
    standards: [
      { code: "US32403", level: "Co-req", credits: 5, title: "Read written texts to participate in everyday life and learning (Literacy CAA)" },
      { code: "US32405", level: "Co-req", credits: 5, title: "Write texts to communicate ideas for everyday life and learning (Literacy CAA)" },
      { code: "AS91098", level: "L1", credits: 4, title: "Analyse specified aspect(s) of studied written text(s)" },
      { code: "AS91101", level: "L2", credits: 6, title: "Produce a selection of crafted and controlled writing (UE Writing)" },
      { code: "AS91098 / AS91100", level: "L2", credits: 4, title: "Analyse significant aspects of visual and written texts (UE Reading)" },
    ],
  },
  {
    domain: "Mathematics & Numeracy",
    modules: "Mathematics Year 10 Start Right, Algebra, Pythagoras, Percentages",
    nceaLevel: "Numeracy Co-req & Level 1",
    standards: [
      { code: "US32406", level: "Co-req", credits: 10, title: "Use mathematics and statistics to meet numeracy demands (Numeracy CAA)" },
      { code: "AS91026", level: "L1", credits: 4, title: "Apply numeric reasoning in solving problems" },
      { code: "AS91027", level: "L1", credits: 4, title: "Apply algebraic procedures in solving problems" },
    ],
  },
  {
    domain: "General Science",
    modules: "Claims & Evidence, Physics Force & Motion, Chemistry Ions & pH, Biology Cells",
    nceaLevel: "Foundation to Level 1",
    standards: [
      { code: "AS90940", level: "L1", credits: 4, title: "Demonstrate understanding of aspects of mechanics (Science 1.1)" },
      { code: "AS90944", level: "L1", credits: 4, title: "Demonstrate understanding of aspects of acids and bases (Science 1.5)" },
      { code: "AS90948", level: "L1", credits: 4, title: "Demonstrate understanding of biological ideas relating to genetic variation (Science 1.9)" },
    ],
  },
  {
    domain: "Psychology & Social Inquiry",
    modules: "Psychology Insight, Social Management, Human Motivations & Incentives",
    nceaLevel: "Level 1 to Level 3 (UE Approved Subject Pathway)",
    standards: [
      { code: "US27694", level: "L1", credits: 4, title: "Demonstrate understanding of psychological approaches" },
      { code: "US27697", level: "L2", credits: 4, title: "Demonstrate understanding of a psychological research method" },
      { code: "US27702", level: "L3", credits: 4, title: "Demonstrate understanding of how psychological theory applies to human issues (UE Pathway)" },
    ],
  },
];

const timelineStages = [
  {
    year: "Term 4, 2026",
    level: "Year 10 Foundation (Age 15 - Current)",
    status: "In Progress",
    goal: "Close science gaps; complete Year 10 English Start Right; confirm Year 10 Maths holds; walk Helios management case.",
    nceaTarget: "No NCEA credits entered yet. This stage ensures Year 10 foundational knowledge holds solid so senior study is fast and confident.",
  },
  {
    year: "2027",
    level: "Year 11 / NCEA Level 1 (Age 16)",
    status: "Upcoming",
    goal: "Achieve the mandatory Literacy (10 cr) & Numeracy (10 cr) Co-requisites via link school / Te Kura; complete Level 1 Business Studies and English.",
    nceaTarget: "60 credits at Level 1 + 20-credit Co-requisite (10 Literacy + 10 Numeracy).",
  },
  {
    year: "2028",
    level: "Year 12 / NCEA Level 2 (Age 17)",
    status: "Planned",
    goal: "Attain University Entrance Literacy (5 Reading + 5 Writing credits at Level 2+); advance Level 2 Commerce and Psychology.",
    nceaTarget: "60 credits at Level 2 (starts accumulating Level 2/3 credits for University Entrance).",
  },
  {
    year: "2029",
    level: "Year 13 / NCEA Level 3 & University Entrance (Age 18)",
    status: "Ultimate Goal",
    goal: "Complete 14+ credits in each of three approved subjects (e.g. Business Studies, Psychology/Social Science, English/Statistics) + NCEA Level 3 certificate.",
    nceaTarget: "Full University Entrance (UE) awarded by NZQA for university degree admission.",
  },
];

export function NceaRoadmap({ fields = [], onStudy }) {
  const [activeTab, setActiveTab] = useState("pillars"); // "pillars" | "frontiers" | "timeline" | "standards"

  const fieldMap = useMemo(() => {
    const map = new Map();
    for (const field of fields) {
      map.set(field.id, field);
    }
    return map;
  }, [fields]);

  // Evaluate student diagnostic frontiers
  const diagnostics = useMemo(() => {
    const math = fieldMap.get("mathematics");
    const eng = fieldMap.get("english");
    const phys = fieldMap.get("physics");
    const chem = fieldMap.get("chemistry");
    const bio = fieldMap.get("biology");
    const claims = fieldMap.get("claims");
    const psych = fieldMap.get("psychology");
    const soc = fieldMap.get("socialManagement");
    const mgmt = fieldMap.get("management") || fieldMap.get("managementCore");

    return {
      strengths: [
        {
          subject: "Psychology & Social Dynamics",
          tier: "Year 11+ (Advanced)",
          description: "Exceptional intuitive reading of human motives, emotional needs vs vices, and organizational incentives. Ready for Level 2/3 psychological inquiry.",
          fieldId: psych?.id || soc?.id || "psychology",
        },
        {
          subject: "Management Strategy (Commerce)",
          tier: "Year 11+ (Advanced)",
          description: "High aptitude for strategic business models, internal resource evaluation, and external macro-environment analysis (Helios case study).",
          fieldId: mgmt?.id || "managementCore",
        },
        {
          subject: "Core Mathematics & Numeracy",
          tier: "Year 10 Solid",
          description: "Year 10 Start Right book completed; core algebra, linear gradient, and Pythagoras are holding. On track for the NCEA Numeracy Co-requisite.",
          fieldId: math?.id || "mathematics",
        },
      ],
      frontiers: [
        {
          subject: "Physics Mechanics & Energy",
          currentLevel: "Foundation / Below Year 10",
          fieldId: phys?.id || "physics",
          limitation: "Force equations (F=ma), velocity vs acceleration, and kinetic/potential energy transformations are currently unfamiliar.",
          whyItMatters: "Essential gate for NCEA Level 1 Science (AS90940 Mechanics) and scientific reasoning.",
          bridgeAction: "Complete the foundation physics sets on balanced forces and energy transfers before tackling Level 1 mechanics.",
        },
        {
          subject: "Chemistry: Particles, Ions & pH",
          currentLevel: "Foundation / Below Year 10",
          fieldId: chem?.id || "chemistry",
          limitation: "Basic pH is understood, but atomic structure (protons/electrons), ionic bonding, and chemical reaction equations are current barriers.",
          whyItMatters: "Prerequisite for NCEA Level 1 Chemistry (AS90944 Acids & Bases).",
          bridgeAction: "Work through subatomic particle charge and neutralisation modules to solidify the chemical vocabulary.",
        },
        {
          subject: "General Biology & Earth Science",
          currentLevel: "Foundation / Below Year 10",
          fieldId: bio?.id || "biology",
          limitation: "Cellular structures, organ systems, and geological evidence are currently very early in development.",
          whyItMatters: "Required for general science literacy before high school science electives.",
          bridgeAction: "Study basic cell organelles and evidence-based claims.",
        },
        {
          subject: "English Academic Writing",
          currentLevel: "Halfway Year 10",
          fieldId: eng?.id || "english",
          limitation: "Year 10 Start Right course is halfway done. Formal comparative essay structure and deep textual inference still need practice.",
          whyItMatters: "Crucial prerequisite for the NCEA Literacy Co-requisite (US32405) and Year 12 UE Literacy Writing (5 credits).",
          bridgeAction: "Complete the remaining Year 10 English modules to establish reliable essay argumentation.",
        },
      ],
    };
  }, [fieldMap]);

  return (
    <div className="ncea-roadmap" role="region" aria-label="NCEA and University Entrance Roadmap">
      <div className="roadmap-hero">
        <p className="roadmap-eyebrow">New Zealand Qualifications Authority (NZQA) Pathway</p>
        <h2 className="roadmap-title">University Entrance Roadmap & Learning Frontiers</h2>
        <p className="roadmap-lead">
          Track your progress toward NCEA Level 1, mandatory Co-requisites, and University Entrance (UE).
          Understand where you have solid mastery, where you are currently limited, and the exact steps to bridge those gaps.
        </p>
      </div>

      <nav className="roadmap-nav" role="tablist" aria-label="Roadmap sections">
        <button
          type="button"
          className={`roadmap-tab ${activeTab === "pillars" ? "is-active" : ""}`}
          role="tab"
          aria-selected={activeTab === "pillars"}
          onClick={() => setActiveTab("pillars")}
        >
          1. The 4 UE Pillars
        </button>
        <button
          type="button"
          className={`roadmap-tab ${activeTab === "frontiers" ? "is-active" : ""}`}
          role="tab"
          aria-selected={activeTab === "frontiers"}
          onClick={() => setActiveTab("frontiers")}
        >
          2. Where You Are Limited (Diagnostic)
        </button>
        <button
          type="button"
          className={`roadmap-tab ${activeTab === "timeline" ? "is-active" : ""}`}
          role="tab"
          aria-selected={activeTab === "timeline"}
          onClick={() => setActiveTab("timeline")}
        >
          3. 4-Year Timeline (2026–2029)
        </button>
        <button
          type="button"
          className={`roadmap-tab ${activeTab === "standards" ? "is-active" : ""}`}
          role="tab"
          aria-selected={activeTab === "standards"}
          onClick={() => setActiveTab("standards")}
        >
          4. NCEA Standards Alignment
        </button>
      </nav>

      {activeTab === "pillars" ? (
        <section className="roadmap-section" aria-label="Four Pillars of University Entrance">
          <h3 className="section-heading">The Four Hurdles for University Entrance in New Zealand</h3>
          <p className="section-desc">
            To attend university in New Zealand, you do not need to do every high school subject.
            You must meet four specific NZQA criteria by the end of Year 13:
          </p>

          <div className="pillars-grid">
            <div className="pillar-card is-active-pillar">
              <div className="pillar-header">
                <span className="pillar-badge">Pillar 1</span>
                <h4>Literacy Co-requisite</h4>
                <span className="pillar-req">10 Credits (Level 1)</span>
              </div>
              <p className="pillar-body">
                Mandatory for any NCEA certificate. Requires passing the Reading (US32403) and Writing (US32405) Common Assessment Activities.
              </p>
              <div className="pillar-status">
                <b>Sophia's Status:</b> Halfway through Year 10 Start Right English. On track to sit in Year 11 (2027) via link school / Te Kura.
              </div>
            </div>

            <div className="pillar-card is-active-pillar">
              <div className="pillar-header">
                <span className="pillar-badge">Pillar 2</span>
                <h4>Numeracy Co-requisite</h4>
                <span className="pillar-req">10 Credits (Level 1)</span>
              </div>
              <p className="pillar-body">
                Mandatory for NCEA. Requires passing the Numeracy Common Assessment Activity (US32406), testing algebra, geometry, and data sense.
              </p>
              <div className="pillar-status">
                <b>Sophia's Status:</b> Year 10 Start Right Maths completed and holding. Solid foundation ready for Year 11 assessment.
              </div>
            </div>

            <div className="pillar-card">
              <div className="pillar-header">
                <span className="pillar-badge">Pillar 3</span>
                <h4>UE Literacy</h4>
                <span className="pillar-req">10 Credits (Level 2+)</span>
              </div>
              <p className="pillar-body">
                Requires at least <b>5 reading credits</b> and <b>5 writing credits</b> from approved Level 2 or Level 3 standards.
              </p>
              <div className="pillar-status">
                <b>Target Year:</b> 2028 (Year 12). Sophia's essay and presentation work will transition to crafted writing standards.
              </div>
            </div>

            <div className="pillar-card">
              <div className="pillar-header">
                <span className="pillar-badge">Pillar 4</span>
                <h4>Three Approved Subjects</h4>
                <span className="pillar-req">14+ Credits each at Level 3</span>
              </div>
              <p className="pillar-body">
                Requires 14 credits at Level 3 in each of three NZQA-approved subjects, plus 60 Level 3 credits overall.
              </p>
              <div className="pillar-status">
                <b>Sophia's Candidate Subjects:</b><br />
                1. <b>Business Studies / Commerce</b> (Management 101, Helios)<br />
                2. <b>Psychology / Social Inquiry</b> (Advanced strength)<br />
                3. <b>English, Statistics, or Science</b>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "frontiers" ? (
        <section className="roadmap-section" aria-label="Learning Frontiers and Limitations">
          <h3 className="section-heading">Where You Are Limited (Your Learning Frontiers)</h3>
          <p className="section-desc">
            Learning is not a test where you are expected to know everything immediately.
            Real learning happens when you clearly identify the boundary between what you already understand and what is currently limiting you.
          </p>

          <div className="frontiers-container">
            <div className="frontiers-block strengths-block">
              <h4 className="frontiers-title">✓ Verified Strengths (At or Above Year 10)</h4>
              <p className="frontiers-caption">These are subjects where your foundational comprehension is strong and ready to deepen:</p>
              <ul className="frontier-list">
                {diagnostics.strengths.map((item) => (
                  <li key={item.subject} className="frontier-item strength-item">
                    <div className="frontier-item-header">
                      <b>{item.subject}</b>
                      <span className="tier-tag">{item.tier}</span>
                    </div>
                    <p className="frontier-desc">{item.description}</p>
                    {onStudy && item.fieldId ? (
                      <button
                        type="button"
                        className="frontier-btn"
                        onClick={() => onStudy(item.fieldId)}
                      >
                        Deepen this subject →
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>

            <div className="frontiers-block limitations-block">
              <h4 className="frontiers-title">⚠️ Current Limitations (Where You Are Gated)</h4>
              <p className="frontiers-caption">
                These are the specific concepts that currently prevent you from advancing to NCEA Level 1 standards:
              </p>
              <ul className="frontier-list">
                {diagnostics.frontiers.map((item) => (
                  <li key={item.subject} className="frontier-item limit-item">
                    <div className="frontier-item-header">
                      <b>{item.subject}</b>
                      <span className="tier-tag limit-tag">{item.currentLevel}</span>
                    </div>
                    <p className="frontier-issue">
                      <b>What limits you:</b> {item.limitation}
                    </p>
                    <p className="frontier-why">
                      <b>Why it matters:</b> {item.whyItMatters}
                    </p>
                    <p className="frontier-bridge">
                      <b>The bridge:</b> {item.bridgeAction}
                    </p>
                    {onStudy && item.fieldId ? (
                      <button
                        type="button"
                        className="frontier-btn action-btn"
                        onClick={() => onStudy(item.fieldId)}
                      >
                        Study this bridge now →
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "timeline" ? (
        <section className="roadmap-section" aria-label="Four-Year Timeline">
          <h3 className="section-heading">Four-Year Pathway: From Year 10 to University (2026–2029)</h3>
          <p className="section-desc">
            A clear timeline ensures you never feel rushed or confused about what year level you are working at:
          </p>

          <ol className="timeline-list">
            {timelineStages.map((stage, idx) => (
              <li key={stage.year} className={`timeline-card ${idx === 0 ? "is-current-stage" : ""}`}>
                <div className="timeline-badge-bar">
                  <span className="timeline-year">{stage.year}</span>
                  <span className="timeline-stage-tag">{stage.status}</span>
                </div>
                <h4 className="timeline-heading">{stage.level}</h4>
                <p className="timeline-goal"><b>Immediate Focus:</b> {stage.goal}</p>
                <div className="timeline-target">
                  <b>Qualification Target:</b> {stage.nceaTarget}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {activeTab === "standards" ? (
        <section className="roadmap-section" aria-label="NCEA Standard Alignment">
          <h3 className="section-heading">How Sophia Modules Map to Real NCEA Achievement Standards</h3>
          <p className="section-desc">
            Practising on Sophia directly prepares you for the official NZQA achievement standards you will sit via your link school or Te Kura:
          </p>

          <div className="standards-table-wrapper">
            <table className="standards-table">
              <thead>
                <tr>
                  <th>Domain & Study Modules</th>
                  <th>NCEA Standard Code</th>
                  <th>Level / Credits</th>
                  <th>Standard Title</th>
                </tr>
              </thead>
              <tbody>
                {standardMappings.map((group) => (
                  group.standards.map((std, idx) => (
                    <tr key={std.code}>
                      {idx === 0 ? (
                        <td rowSpan={group.standards.length} className="domain-cell">
                          <b>{group.domain}</b>
                          <div className="module-subtext">{group.modules}</div>
                          <span className="domain-target-badge">{group.nceaLevel}</span>
                        </td>
                      ) : null}
                      <td><code>{std.code}</code></td>
                      <td><b>{std.level}</b> ({std.credits} cr)</td>
                      <td>{std.title}</td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
