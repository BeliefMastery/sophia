import { useState } from "react";
import { domainsFromCatalog, findSubfield } from "../content/interest-tree.mjs";
import { voteSummary } from "../lib/expansion.mjs";

export function InterestVote({ catalog, vote, onSave, saving, error }) {
  const domains = domainsFromCatalog(catalog);
  const summary = voteSummary(vote, catalog);
  const [domainId, setDomainId] = useState(summary?.domainId || domains[0]?.id || "");
  const domain = domains.find((entry) => entry.id === domainId) || domains[0];
  const [subfieldId, setSubfieldId] = useState(summary?.subfieldId || domain?.subfields?.[0]?.id || "");

  if (!domains.length) {
    return <p className="quiet">The interest catalog is not loaded yet.</p>;
  }

  const activeDomain = domains.find((entry) => entry.id === domainId) || domain;
  const subfields = activeDomain?.subfields || [];

  function pickDomain(nextId) {
    setDomainId(nextId);
    const next = domains.find((entry) => entry.id === nextId);
    setSubfieldId(next?.subfields?.[0]?.id || "");
  }

  function submit() {
    const subfield = findSubfield(domains, domainId, subfieldId);
    if (!subfield) return;
    onSave({
      domainId,
      subfieldId,
      field: subfield.field,
      submittedAt: Date.now(),
    });
  }

  return (
    <div className="interest">
      <h2>Next field to deepen</h2>
      <p>Choose one subfield. The parent uses this vote when writing the next shared cluster.</p>
      {summary ? (
        <p className="quiet">Current vote: {summary.domainTitle} / {summary.title}</p>
      ) : (
        <p className="quiet">No vote yet.</p>
      )}
      <label>
        Domain
        <select value={domainId} onChange={(event) => pickDomain(event.target.value)}>
          {domains.map((entry) => (
            <option key={entry.id} value={entry.id}>{entry.title}</option>
          ))}
        </select>
      </label>
      <fieldset className="interest-subfields">
        <legend>Subfield</legend>
        <ul className="interest-list">
          {subfields.map((subfield) => (
            <li key={subfield.id}>
              <label className="interest-option">
                <input
                  type="radio"
                  name="interest-subfield"
                  value={subfield.id}
                  checked={subfieldId === subfield.id}
                  onChange={() => setSubfieldId(subfield.id)}
                />
                <span>{subfield.title}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      {error ? <p className="alert" role="alert">{error}</p> : null}
      <button type="button" className="primary" disabled={!subfieldId || saving} onClick={submit}>
        {saving ? "Saving…" : "Save this vote"}
      </button>
    </div>
  );
}
