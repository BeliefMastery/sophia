function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function phraseList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => normalizeText(entry))
    .filter((entry) => entry.length > 0);
}

function containsPhrase(haystack, phrase) {
  if (!haystack || !phrase) return false;
  const tokens = haystack.split(" ").filter(Boolean);
  const parts = phrase.split(" ").filter(Boolean);
  if (!parts.length) return false;
  // Short or numeric accepts must match whole tokens (so "5" does not hit "15").
  const tight = phrase.length <= 3 || /^\d+(\s+\d+)*$/.test(phrase) || parts.every((part) => part.length <= 3);
  if (tight || parts.length === 1) {
    for (let i = 0; i <= tokens.length - parts.length; i += 1) {
      if (parts.every((part, offset) => tokens[i + offset] === part)) return true;
    }
    if (!tight && parts.length === 1) return haystack.includes(phrase);
    return false;
  }
  return haystack.includes(phrase);
}

/**
 * Auto-mark a written repair against guide keys.
 * Does not change first-attempt choice matching.
 */
function markRepair(answer, guide = {}) {
  const text = normalizeText(answer);
  const accept = phraseList(guide.repairAccept);
  const lookFor = phraseList(guide.lookFor);

  if (!text) {
    return {
      result: "unknown",
      note: "No written answer to mark.",
      source: "auto",
    };
  }

  if (accept.length) {
    const hit = accept.find((phrase) => containsPhrase(text, phrase));
    if (hit) {
      return {
        result: "known",
        note: `Matched an accepted answer (${hit}).`,
        source: "auto",
      };
    }
  }

  if (!accept.length && !lookFor.length) {
    return {
      result: "partial",
      note: "Saved; no auto-mark key yet",
      source: "auto",
    };
  }

  if (lookFor.length) {
    const hits = lookFor.filter((phrase) => containsPhrase(text, phrase));
    if (hits.length === lookFor.length) {
      return {
        result: "known",
        note: `Matched all ${lookFor.length} look-for lines.`,
        source: "auto",
      };
    }
    if (hits.length > 0) {
      return {
        result: "partial",
        note: `Matched ${hits.length} of ${lookFor.length} look-for lines.`,
        source: "auto",
      };
    }
    if (accept.length) {
      return {
        result: "unknown",
        note: "Did not match an accepted answer or look-for line.",
        source: "auto",
      };
    }
    return {
      result: "unknown",
      note: "Did not match any look-for line.",
      source: "auto",
    };
  }

  return {
    result: "unknown",
    note: "Did not match an accepted answer.",
    source: "auto",
  };
}

function reviewRecord(itemId, mark, submittedAt = Date.now()) {
  return {
    itemId,
    result: mark.result,
    note: mark.note,
    source: mark.source || "auto",
    submittedAt,
  };
}

export { normalizeText, markRepair, reviewRecord };
