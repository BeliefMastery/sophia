function lines(value) {
  if (Array.isArray(value)) return value.filter((line) => line);
  if (value && typeof value === "object") {
    return Object.keys(value).sort((a, b) => Number(a) - Number(b)).map((key) => value[key]).filter((line) => line);
  }
  return [];
}

function resourceList(value) {
  const list = Array.isArray(value)
    ? value
    : value && typeof value === "object"
      ? Object.keys(value).sort((a, b) => Number(a) - Number(b)).map((key) => value[key])
      : [];
  return list.filter((entry) => entry && typeof entry.label === "string" && entry.label.trim());
}

function explainMiss(item, guide) {
  const answerId = guide?.answer || "";
  const answerText = item?.choices?.[answerId]?.text || "";
  return {
    answerText,
    explanation: lines(guide?.lookFor),
    slips: lines(guide?.misconceptions),
  };
}

export { explainMiss, resourceList };
