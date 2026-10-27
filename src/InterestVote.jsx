import { useEffect, useState } from "react";
import { optionsFromCatalog } from "../content/interest-tree.mjs";

function groupOptions(options) {
  const groups = new Map();
  for (const option of options) {
    const list = groups.get(option.group) || [];
    list.push(option);
    groups.set(option.group, list);
  }
  return [...groups.entries()];
}

export function InterestVote({ catalog, interests, onSave, saving, error }) {
  const options = optionsFromCatalog(catalog);
  const [ticks, setTicks] = useState({});

  useEffect(() => {
    const listed = optionsFromCatalog(catalog);
    const next = {};
    for (const option of listed) {
      next[option.id] = interests?.[option.id] === true;
    }
    setTicks(next);
  }, [catalog, interests]);

  if (!options.length) {
    return <p className="quiet">Interest options are still loading.</p>;
  }

  function toggle(id) {
    setTicks((current) => ({ ...current, [id]: !current[id] }));
  }

  function submit() {
    const record = { updatedAt: Date.now() };
    for (const option of options) {
      if (ticks[option.id]) record[option.id] = true;
    }
    onSave(record);
  }

  const selected = options.filter((option) => ticks[option.id]).map((option) => option.title);

  return (
    <div className="interest">
      <h2>Subjects you care about</h2>
      <p>
        Tick school or university subjects you want to keep an eye on.
        This only saves your interest list. It does not unlock new questions by itself.
      </p>
      {selected.length ? (
        <p className="quiet">Selected: {selected.join(", ")}</p>
      ) : (
        <p className="quiet">Nothing selected yet.</p>
      )}
      {groupOptions(options).map(([group, rows]) => (
        <fieldset key={group} className="interest-subfields">
          <legend>{group}</legend>
          <ul className="interest-list">
            {rows.map((option) => (
              <li key={option.id}>
                <label className="interest-option">
                  <input
                    type="checkbox"
                    checked={Boolean(ticks[option.id])}
                    onChange={() => toggle(option.id)}
                  />
                  <span>{option.title}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      ))}
      {error ? <p className="alert" role="alert">{error}</p> : null}
      <button type="button" className="primary" disabled={saving} onClick={submit}>
        {saving ? "Saving…" : "Save interests"}
      </button>
    </div>
  );
}
