import { useMemo, useState } from "react";
import { nodes, treeCatalogRecord } from "../content/knowledge-tree.mjs";
import { evaluateTree, nodesByTier, childrenOf } from "../lib/knowledgeTree.mjs";

const stateLabel = {
  planned: "Planned",
  locked: "Locked",
  open: "Open",
  active: "Active",
  complete: "Complete",
};

function interestKey(node) {
  return node.field || node.id;
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
    // Drop falsey leftover keys except updatedAt
    for (const [id, value] of Object.entries(next)) {
      if (id !== "updatedAt" && value !== true) delete next[id];
    }
    onSaveInterests(next);
  }

  function onNodeActivate(node) {
    setFocusId(node.id);
    if (node.studyable && node.field && (node.state === "open" || node.state === "active" || node.state === "complete")) {
      onStudy(node.field);
    }
  }

  return (
    <div className="tech-tree">
      <p className="quiet">
        Work through open branches. Locked ones wait on earlier knowledge. Planned ones are not written yet — mark interest if you want them later.
      </p>
      <div className="tech-board" role="list">
        {tiers.map(({ tier, nodes }) => (
          <div key={tier} className="tech-column" data-tier={tier}>
            <p className="tech-column-label">{tier === 0 ? "Domains" : `Branch ${tier}`}</p>
            <ul className="tech-nodes">
              {nodes.map((node) => {
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
          {focus.studyable && focus.field ? (
            <button
              type="button"
              className="primary"
              onClick={() => onStudy(focus.field)}
            >
              {focus.state === "active" ? "Continue this field" : focus.state === "complete" ? "Open this field" : "Study this field"}
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
