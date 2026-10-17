function checkInterestTree(options) {
  const errors = [];
  if (!Array.isArray(options) || !options.length) {
    return ["interest options need at least one entry"];
  }
  const ids = new Set();
  for (const option of options) {
    if (!option?.id || typeof option.id !== "string") errors.push("option missing id");
    else if (ids.has(option.id)) errors.push(`duplicate interest id ${option.id}`);
    else ids.add(option.id);
    if (!option?.title || typeof option.title !== "string") {
      errors.push(`option ${option?.id || "?"} missing title`);
    }
    if (!option?.group || typeof option.group !== "string") {
      errors.push(`option ${option?.id || "?"} missing group`);
    }
  }
  return errors;
}

export { checkInterestTree };
