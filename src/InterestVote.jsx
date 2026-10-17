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
    return <p className="quiet">Interest options are not loaded yet.</p>;
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
      <h2>Fields of interest</h2>
      <p>Tick any school or university fields you care about. This only registers interest. It does not add a module by itself.</p>
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
