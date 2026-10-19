import { useMemo, useState } from "react";
import { nodes, nodesFromCatalog, treeCatalogRecord } from "../content/knowledge-tree.mjs";
import {
  effectiveEntrance,
  entranceRecordForSave,
  optionsFromCatalog,
  visibleEntranceNodeIds,
} from "../content/entrance-targets.mjs";
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

function domainMeta(evaluated, root, allowNode) {
  const desc = descendantsOf(evaluated, root.id).filter(allowNode);
  const openCount = desc.filter((node) => node.state === "open" || node.state === "active" || node.state === "practice").length;
  const branchCount = desc.length;
  const parts = [`${branchCount} branch${branchCount === 1 ? "" : "es"}`];
  if (openCount) parts.push(`${openCount} open`);
  return parts.join(" · ");
}

function domainShouldOpen(evaluated, root, focusId, allowNode) {
  if (focusId === root.id) return true;
  if (allowNode(root) && (root.state === "active" || root.state === "practice")) return true;
  const desc = descendantsOf(evaluated, root.id).filter(allowNode);
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
  allowNode,
}) {
  const kids = childrenOf(evaluated, parentId).filter(allowNode);
  if (!kids.length) return null;
  return (
    <ul className="tech-children">
      {kids.map((node) => {
        const nested = childrenOf(evaluated, node.id).filter(allowNode);
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
                allowNode={allowNode}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function DomainBlock({
  root,
  evaluated,
  focusId,
  interests,
  onActivate,
  allowNode,
  forcedOpen,
  onToggle,
  includeRootCard,
}) {
  const open = Object.prototype.hasOwnProperty.call(forcedOpen, root.id)
    ? forcedOpen[root.id]
    : domainShouldOpen(evaluated, root, focusId, allowNode);
  const kids = childrenOf(evaluated, root.id).filter(allowNode);
  const showRoot = includeRootCard && allowNode(root) && (root.field || root.summary);

  return (
    <div className={`tech-domain${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="tech-domain-summary"
        aria-expanded={open}
        onClick={() => onToggle(root, open)}
      >
        <span className="tech-domain-heading">
          <NodeSymbol symbol={root.symbol} title={root.title} />
          <span className="tech-domain-title">{root.title}</span>
        </span>
        <span className="tech-domain-meta">{domainMeta(evaluated, root, allowNode)}</span>
      </button>
      {open ? (
        <div className="tech-domain-body">
          {showRoot ? (
            <NodeCard
              node={root}
              focusId={focusId}
              interested={interests?.[interestKey(root)] === true}
              onActivate={onActivate}
            />
          ) : null}
          {kids.length ? (
            <BranchList
              evaluated={evaluated}
              parentId={root.id}
              focusId={focusId}
              interests={interests}
              onActivate={onActivate}
              allowNode={allowNode}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function KnowledgeTree({
  tree,
  fields,
  interests,
  entrance,
  entranceCatalog,
  onStudy,
  onSaveInterests,
  onSaveEntrance,
  savingInterest,
  savingEntrance,
  interestError,
  entranceError,
}) {
  const source = useMemo(() => {
    if (tree && typeof tree === "object" && Object.keys(tree).length) return tree;
    return treeCatalogRecord(nodes);
  }, [tree]);
  const evaluated = useMemo(() => evaluateTree(source, fields || []), [source, fields]);
  const treeNodes = useMemo(() => {
    if (Array.isArray(source)) return source;
    if (source && typeof source === "object" && Object.keys(source).length) {
      return nodesFromCatalog(source);
    }
    return nodes;
  }, [source]);
  const entranceOptions = useMemo(
    () => optionsFromCatalog(entranceCatalog),
    [entranceCatalog],
  );
  const entranceTicks = useMemo(
    () => effectiveEntrance(entrance, entranceCatalog || entranceOptions),
    [entrance, entranceCatalog, entranceOptions],
  );
  const entranceIds = useMemo(
    () => visibleEntranceNodeIds(entranceTicks, entranceCatalog || entranceOptions, treeNodes),
    [entranceTicks, entranceCatalog, entranceOptions, treeNodes],
  );
  const allowEntrance = useMemo(
    () => (node) => node.wing !== "additional" && entranceIds.has(node.id),
    [entranceIds],
  );
  const allowAdditional = useMemo(
    () => (node) => node.wing === "additional",
    [],
  );
  const entranceRoots = useMemo(
    () => evaluated
      .filter((node) => !node.parentId)
      .filter((root) => allowEntrance(root) || descendantsOf(evaluated, root.id).some(allowEntrance))
      .sort((a, b) => (a.order || 0) - (b.order || 0) || a.title.localeCompare(b.title)),
    [evaluated, allowEntrance],
  );
  const additionalSections = useMemo(() => {
    const roots = evaluated
      .filter((node) => !node.parentId)
      .sort((a, b) => (a.order || 0) - (b.order || 0) || a.title.localeCompare(b.title));
    return roots.filter((root) => {
      if (root.wing === "additional") return true;
      return descendantsOf(evaluated, root.id).some(allowAdditional);
    });
  }, [evaluated, allowAdditional]);
  const [focusId, setFocusId] = useState("");
  const [forcedOpen, setForcedOpen] = useState({});
  const [additionalOpen, setAdditionalOpen] = useState(false);
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

  function toggleEntrance(optionId, always) {
    if (always || !onSaveEntrance) return;
    const next = { ...entranceTicks };
    if (next[optionId]) delete next[optionId];
    else next[optionId] = true;
    onSaveEntrance(entranceRecordForSave(next, entranceCatalog || entranceOptions));
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

  function toggleDomain(root, wasOpen) {
    setForcedOpen((current) => ({ ...current, [root.id]: !wasOpen }));
  }

  return (
    <div className="tech-tree">
      <p className="quiet">
        This map is the University Entrance ramp: literacy, numeracy, school science, and the pathway subjects you switch on.
        Hold a module (five of six on a six-question set) to open a deeper branch. Falling short keeps you in this field for another module at the same level.
      </p>
      <div className="tech-entrance-targets">
        <h2 className="tech-section-title">Entrance subjects</h2>
        <p className="quiet">English and mathematics stay on. Tick the pathway subjects you are preparing.</p>
        <ul className="tech-entrance-list">
          {entranceOptions.map((option) => (
            <li key={option.id}>
              <label className="tech-interest-toggle">
                <input
                  type="checkbox"
                  checked={entranceTicks[option.id] === true}
                  disabled={option.always || savingEntrance || !onSaveEntrance}
                  onChange={() => toggleEntrance(option.id, option.always)}
                />
                <span>
                  {option.title}
                  {option.always ? " (always on)" : ""}
                </span>
              </label>
            </li>
          ))}
        </ul>
        {entranceError ? <p className="alert" role="alert">{entranceError}</p> : null}
        {savingEntrance ? <p className="quiet">Saving entrance subjects…</p> : null}
      </div>
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
        {entranceRoots.map((root) => (
          <DomainBlock
            key={root.id}
            root={root}
            evaluated={evaluated}
            focusId={focusId}
            interests={interests}
            onActivate={onNodeActivate}
            allowNode={allowEntrance}
            forcedOpen={forcedOpen}
            onToggle={toggleDomain}
            includeRootCard
          />
        ))}
      </div>

      {additionalSections.length ? (
        <div className={`tech-additional${additionalOpen ? " is-open" : ""}`}>
          <button
            type="button"
            className="tech-additional-summary"
            aria-expanded={additionalOpen}
            onClick={() => setAdditionalOpen((open) => !open)}
          >
            <span className="tech-domain-title">Additional fields</span>
            <span className="tech-domain-meta">Beyond the entrance ramp</span>
          </button>
          {additionalOpen ? (
            <div className="tech-additional-body">
              <p className="quiet">
                Introductory university subjects stay studyable here. They are not the front door for University Entrance preparation.
              </p>
              <div className="tech-outline" role="list">
                {additionalSections.map((root) => (
                  <DomainBlock
                    key={`extra-${root.id}`}
                    root={root}
                    evaluated={evaluated}
                    focusId={focusId}
                    interests={interests}
                    onActivate={onNodeActivate}
                    allowNode={allowAdditional}
                    forcedOpen={forcedOpen}
                    onToggle={toggleDomain}
                    includeRootCard={root.wing === "additional"}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

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
