function checkInterestTree(domains) {
  const errors = [];
  if (!Array.isArray(domains) || !domains.length) {
    return ["interest tree needs at least one domain"];
  }
  const domainIds = new Set();
  const subfieldIds = new Set();
  const fields = new Set();
  for (const domain of domains) {
    if (!domain?.id || typeof domain.id !== "string") errors.push("domain missing id");
    else if (domainIds.has(domain.id)) errors.push(`duplicate domain id ${domain.id}`);
    else domainIds.add(domain.id);
    if (!domain?.title || typeof domain.title !== "string") {
      errors.push(`domain ${domain?.id || "?"} missing title`);
    }
    if (!Array.isArray(domain?.subfields) || !domain.subfields.length) {
      errors.push(`domain ${domain?.id || "?"} needs subfields`);
      continue;
    }
    for (const subfield of domain.subfields) {
      if (!subfield?.id || typeof subfield.id !== "string") {
        errors.push(`domain ${domain.id} has a subfield without id`);
        continue;
      }
      if (subfieldIds.has(subfield.id)) errors.push(`duplicate subfield id ${subfield.id}`);
      else subfieldIds.add(subfield.id);
      if (!subfield.title || typeof subfield.title !== "string") {
        errors.push(`subfield ${subfield.id} missing title`);
      }
      if (!subfield.field || typeof subfield.field !== "string") {
        errors.push(`subfield ${subfield.id} missing field`);
      } else if (fields.has(subfield.field) && subfield.field !== subfield.id) {
        // same field on one subfield id is fine; two different subfield ids sharing field is ok for future
      }
      if (subfield.field) fields.add(subfield.field);
    }
  }
  return errors;
}

export { checkInterestTree };
