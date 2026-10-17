import { useMemo, useState } from "react";
import { nodes, treeCatalogRecord } from "../content/knowledge-tree.mjs";
import { evaluateTree, childrenOf } from "../lib/knowledgeTree.mjs";
import { moduleLabel } from "../lib/expansion.mjs";

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

function NodeSymbol({ symbol, title }) {
  if (!symbol) return null;
  return (
    <span className="tech-symbol" aria-hidden="true" title={title}>
      {symbol}
    </span>
  );
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

function descendantsOf(evaluated, parentId) {
  const kids = childrenOf(evaluated, parentId);
  return kids.concat(...kids.map((kid) => descendantsOf(evaluated, kid.id)));
}

function domainMeta(evaluated, root) {
  const desc = descendantsOf(evaluated, root.id);
  const openCount = desc.filter((node) => node.state === "open" || node.state === "active" || node.state === "practice").length;
  const branchCount = desc.length;
  const parts = [`${branchCount} branch${branchCount === 1 ? "" : "es"}`];
  if (openCount) parts.push(`${openCount} open`);
  return parts.join(" · ");
}

function domainShouldOpen(evaluated, root, focusId) {
  if (focusId === root.id) return true;
  if (root.state === "active" || root.state === "practice") return true;
  const desc = descendantsOf(evaluated, root.id);
  if (focusId && desc.some((node) => node.id === focusId)) return true;
  return desc.some((node) => node.state === "active" || node.state === "practice");
}

function progressMeta(node) {
  if (!node.progress) return null;
  const parts = [`${node.progress.answered} of ${node.progress.total}`];
  if (node.progress.moduleRoman || node.progress.depth) {
    parts.push(node.progress.moduleRoman || moduleLabel(node.progress.depth));
  }
  if (node.progress.complete) {
    parts.push(`${node.progress.matched} held (need ${node.progress.need})`);
  }
  return parts.filter(Boolean).join(" · ");
}

function NodeCard({
  node,
  focusId,
  interested,
  onActivate,
}) {
  return (
    <button
      type="button"
      className={`tech-node is-${node.state}${focusId === node.id ? " is-focus" : ""}`}
      onClick={() => onActivate(node)}
    >
      <span className="tech-node-heading">
        <NodeSymbol symbol={node.symbol} title={node.title} />
        <span className="tech-node-title">{node.title}</span>
      </span>
      <span className={`tech-chip is-${node.state}`}>{stateLabel[node.state]}</span>
      <span className="tech-node-summary">{node.summary}</span>
      {node.progress ? (
        <>
          <span className="tech-node-meta">{progressMeta(node)}</span>
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
  );
}

function BranchList({
  evaluated,
  parentId,
  focusId,
  interests,
  onActivate,
}) {
  const kids = childrenOf(evaluated, parentId);
  if (!kids.length) return null;
  return (
    <ul className="tech-children">
      {kids.map((node) => {
        const nested = childrenOf(evaluated, node.id);
        return (
          <li key={node.id} className="tech-branch-item">
            <NodeCard
              node={node}
              focusId={focusId}
              interested={interests?.[interestKey(node)] === true}
              onActivate={onActivate}
            />
            {nested.length ? (
              <BranchList
                evaluated={evaluated}
                parentId={node.id}
                focusId={focusId}
                interests={interests}
                onActivate={onActivate}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
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
  const roots = useMemo(
    () => evaluated.filter((node) => !node.parentId)
      .sort((a, b) => (a.order || 0) - (b.order || 0) || a.title.localeCompare(b.title)),
    [evaluated],
  );
  const [focusId, setFocusId] = useState("");
  const [forcedOpen, setForcedOpen] = useState({});
  const focus = evaluated.find((node) => node.id === focusId) || null;
  const awaiting = useMemo(
    () => (fields || []).filter((field) => field.awaitingModule),
    [fields],
  );

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

  function isDomainOpen(root) {
    if (Object.prototype.hasOwnProperty.call(forcedOpen, root.id)) return forcedOpen[root.id];
    return domainShouldOpen(evaluated, root, focusId);
  }

  function onDomainToggle(root, event) {
    setForcedOpen((current) => ({
      ...current,
      [root.id]: event.currentTarget.open,
    }));
  }

  return (
    <div className="tech-tree">
      <p className="quiet">
        Work through open branches. Hold a module (five of six on a six-question set) to open a deeper branch.
        Falling short keeps you in this field for another module at the same level. Planned ones are not written yet.
      </p>
      {awaiting.length ? (
        <div className="tech-await" role="status">
          <p>
            {awaiting.length === 1
              ? `${awaiting[0].title} needs a new ${awaiting[0].held ? "deeper" : "same-level"} module.`
              : `${awaiting.length} fields are waiting on new modules.`}
            {" "}
            Your admin has been notified. Meanwhile you can study other open branches or mark interests below.
          </p>
          <ul>
            {awaiting.map((field) => (
              <li key={field.id}>
                <span className="tech-await-title">{field.title}</span>
                <span className="quiet">
                  {" · "}
                  {field.held ? "deepen" : "practice"}
                  {field.nextModuleRoman ? ` · ${field.nextModuleRoman}` : ""}
                  {field.nextStrandId ? ` · ${field.nextStrandId}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="tech-outline" role="list">
        {roots.map((root) => {
          const open = isDomainOpen(root);
          const kids = childrenOf(evaluated, root.id);
          return (
            <details
              key={root.id}
              className="tech-domain"
              open={open}
              onToggle={(event) => onDomainToggle(root, event)}
            >
              <summary className="tech-domain-summary">
                <span className="tech-domain-heading">
                  <NodeSymbol symbol={root.symbol} title={root.title} />
                  <span className="tech-domain-title">{root.title}</span>
                </span>
                <span className="tech-domain-meta">{domainMeta(evaluated, root)}</span>
              </summary>
              <div className="tech-domain-body">
                {root.field || root.summary ? (
                  <NodeCard
                    node={root}
                    focusId={focusId}
                    interested={interests?.[interestKey(root)] === true}
                    onActivate={onNodeActivate}
                  />
                ) : null}
                {kids.length ? (
                  <BranchList
                    evaluated={evaluated}
                    parentId={root.id}
                    focusId={focusId}
                    interests={interests}
                    onActivate={onNodeActivate}
                  />
                ) : null}
              </div>
            </details>
          );
        })}
      </div>

      {focus ? (
        <div className="tech-detail">
          <h2>
            <NodeSymbol symbol={focus.symbol} title={focus.title} />
            {" "}
            {focus.title}
          </h2>
          <p>{focus.summary}</p>
          <p className="quiet">{focus.reason}</p>
          {focus.progress?.moduleRoman ? (
            <p className="quiet">{focus.progress.moduleRoman}</p>
          ) : null}
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
