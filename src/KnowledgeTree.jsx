import { useMemo, useState } from "react";
import { nodes, treeCatalogRecord } from "../content/knowledge-tree.mjs";
import { evaluateTree, nodesByTier, childrenOf } from "../lib/knowledgeTree.mjs";

const stateLabel = {
  planned: "Planned",
  locked: "Locked",
  open: "Open",
  active: "Active",
  complete: "Complete",
  practice: "Practice",
};

function interestKey(node) {
  return node.field || node.id;
}

function ResultMarks({ marks, complete, held }) {
  if (!marks?.length) return null;
  return (
    <div className="tech-marks" aria-label="Question results">
      {marks.map((mark, index) => (
        <span key={`${mark}-${index}`} className={`tech-mark is-${mark}`} title={mark} />
      ))}
      {complete ? (
        <span className="tech-mark-caption">
          {held ? "Deeper branch open" : "Another module in this field"}
        </span>
      ) : null}
    </div>
  );
}

export function KnowledgeTree({
  tree,
  fields,
  interests,
  onStudy,
  onSaveInterests,
  savingInterest,
  interestError,
}) {
  const source = useMemo(() => {
    if (tree && typeof tree === "object" && Object.keys(tree).length) return tree;
    return treeCatalogRecord(nodes);
  }, [tree]);
  const evaluated = useMemo(() => evaluateTree(source, fields || []), [source, fields]);
  const tiers = useMemo(() => nodesByTier(evaluated), [evaluated]);
  const [focusId, setFocusId] = useState("");
  const focus = evaluated.find((node) => node.id === focusId) || null;

  function toggleInterest(node) {
    const key = interestKey(node);
    const next = { ...(interests || {}), updatedAt: Date.now() };
    if (next[key]) delete next[key];
    else next[key] = true;
    for (const [id, value] of Object.entries(next)) {
      if (id !== "updatedAt" && value !== true) delete next[id];
    }
    onSaveInterests(next);
  }

  function onNodeActivate(node) {
    setFocusId(node.id);
    if (
      node.studyable
      && node.field
      && (node.state === "open" || node.state === "active" || node.state === "complete" || node.state === "practice")
    ) {
      onStudy(node.field);
    }
  }

  return (
    <div className="tech-tree">
      <p className="quiet">
        Work through open branches. A deeper branch opens when enough first answers match.
        Falling short keeps you in this field for another module. Planned ones are not written yet.
      </p>
      <div className="tech-board" role="list">
        {tiers.map(({ tier, nodes: tierNodes }) => (
          <div key={tier} className="tech-column" data-tier={tier}>
            <p className="tech-column-label">{tier === 0 ? "Domains" : `Branch ${tier}`}</p>
            <ul className="tech-nodes">
              {tierNodes.map((node) => {
                const kids = childrenOf(evaluated, node.id);
                const interested = interests?.[interestKey(node)] === true;
                return (
                  <li key={node.id} className="tech-node-wrap">
                    {node.parentId ? <span className="tech-link" aria-hidden="true" /> : null}
                    <button
                      type="button"
                      role="listitem"
                      className={`tech-node is-${node.state}${focusId === node.id ? " is-focus" : ""}`}
                      onClick={() => onNodeActivate(node)}
                    >
                      <span className="tech-node-title">{node.title}</span>
                      <span className={`tech-chip is-${node.state}`}>{stateLabel[node.state]}</span>
                      <span className="tech-node-summary">{node.summary}</span>
                      {node.progress ? (
                        <>
                          <span className="tech-node-meta">
                            {node.progress.answered} of {node.progress.total}
                            {node.progress.complete
                              ? ` · ${node.progress.matched} held (need ${node.progress.need})`
                              : ""}
                            {node.progress.depth ? ` · Depth ${node.progress.depth}` : ""}
                          </span>
                          <span className="meter" aria-hidden="true">
                            <span style={{
                              width: `${node.progress.total
                                ? (node.progress.answered / node.progress.total) * 100
                                : 0}%`,
                            }}
                            />
                          </span>
                          <ResultMarks
                            marks={node.progress.marks}
                            complete={node.progress.complete}
                            held={node.progress.held}
                          />
                        </>
                      ) : null}
                      {interested ? <span className="tech-interest">Interest marked</span> : null}
                    </button>
                    {kids.length ? (
                      <span className="tech-fan" aria-hidden="true">{kids.length}</span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {focus ? (
        <div className="tech-detail">
          <h2>{focus.title}</h2>
          <p>{focus.summary}</p>
          <p className="quiet">{focus.reason}</p>
          {focus.progress?.marks?.length ? (
            <ResultMarks
              marks={focus.progress.marks}
              complete={focus.progress.complete}
              held={focus.progress.held}
            />
          ) : null}
          {focus.studyable && focus.field ? (
            <button
              type="button"
              className="primary"
              onClick={() => onStudy(focus.field)}
            >
              {focus.state === "active"
                ? "Continue this field"
                : focus.state === "practice"
                  ? "Open this field"
                  : focus.state === "complete"
                    ? "Open this field"
                    : "Study this field"}
            </button>
          ) : null}
          {focus.field ? (
            <label className="tech-interest-toggle">
              <input
                type="checkbox"
                checked={interests?.[interestKey(focus)] === true}
                onChange={() => toggleInterest(focus)}
                disabled={savingInterest}
              />
              <span>Mark as an interest</span>
            </label>
          ) : null}
          {interestError ? <p className="alert" role="alert">{interestError}</p> : null}
          {savingInterest ? <p className="quiet">Saving interest…</p> : null}
        </div>
      ) : null}
    </div>
  );
}
