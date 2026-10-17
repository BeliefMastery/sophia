import { useRef, useState } from "react";
import { ageTiers } from "../lib/expansion.mjs";

function fillClass(position) {
  if (position > 25) return "is-above";
  if (position === 25) return "is-peer";
  return "is-below";
}

export function DepthChart({ marks }) {
  return (
    <div className="depth">
      <p>
        Depth is how many finished modules she has in that field. The bar is the age tier those results support.
        A weak note that simply holds stays left of the peer line. Depth is not an excellent achievement.
      </p>
      <p className="quiet">
        Age tiers: Year 9 at age 14, Year 10 at age 15, Year 11 at age 16, Year 12 at age 17, Year 13 at age 18.
        Peers are at Year 10. This does not award NCEA.
      </p>
      <div className="depth-ticks" aria-hidden="true">
        {ageTiers.map((tier) => (
          <span key={tier.id}>{tier.label}<br />Age {tier.age}</span>
        ))}
      </div>
      <ul className="depth-list">
        {marks.map((mark) => (
          <li key={mark.claimId}>
            <p>
              <b>{mark.title}</b>
              {` · Depth ${mark.depth} · ${mark.label}`}
            </p>
            <div className="depth-scale" aria-hidden="true">
              <span className="depth-peer" />
              {mark.position == null ? null : (
                <span className={`depth-fill ${fillClass(mark.position)}`} style={{ width: `${mark.position}%` }} />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FieldCounts({ fields }) {
  return (
    <ul className="field-counts">
      {(fields || []).map((field) => (
        <li key={field.id}>
          <span>{field.title}</span>
          <b>{field.answered} of {field.total}</b>
        </li>
      ))}
    </ul>
  );
}

export function InterestReport({ ticks }) {
  return (
    <div className="interest-report">
      <h2>Registered interests</h2>
      <p className="quiet">Checkbox register only. Ticks do not create or choose the next module.</p>
      {ticks?.length ? (
        <ul className="avoided-list">
          {ticks.map((entry) => (
            <li key={entry.id}>{entry.group}: {entry.title}</li>
          ))}
        </ul>
      ) : (
        <p className="quiet">No interests ticked yet.</p>
      )}
    </div>
  );
}

export function ExpansionPrompt({ prompt, pending }) {
  const areaRef = useRef(null);
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
    } catch {
      areaRef.current?.focus();
      areaRef.current?.select();
      setCopied(false);
    }
  }

  if (!prompt) {
    return <p>{pending}</p>;
  }

  return (
    <>
      <p>
        This section is complete. Paste the prompt into Cursor. The next agent fetches the results and writes one new module at the difficulty named here.
      </p>
      <label>
        Expansion prompt
        <textarea ref={areaRef} className="expansion-prompt" readOnly rows={18} value={prompt} />
      </label>
      <button type="button" className="primary" onClick={onCopy}>Copy the prompt</button>
      {copied ? <p className="quiet">Copied.</p> : null}
    </>
  );
}
