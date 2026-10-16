const yearPlace = {
  mathematics: "year",
  english: "halfway",
  chemistry: "partial",
  physics: "below",
  biology: "below",
  geology: "below",
  history: "below",
  politics: "below",
  technology: "below",
  psychology: "above",
  socialManagement: "above",
};

function rewardFor(verdict) {
  if (!verdict || verdict.open) return null;
  if (verdict.direction === "behind" || verdict.direction === "mixed") return null;
  const place = yearPlace[verdict.claimId];
  if (!place) return null;
  if (verdict.validated && place === "above") {
    return {
      level: "excellent",
      title: "Excellent achievement",
      detail: `This is above the usual Year 10 level for age 15. The October note already called this advanced (${verdict.assessment}), and these answers hold that.`,
    };
  }
  if (verdict.direction === "ahead") {
    return {
      level: "achievement",
      title: "Achievement",
      detail: aheadDetail(verdict, place),
    };
  }
  if (verdict.validated && (place === "year" || place === "halfway" || place === "partial")) {
    return {
      level: "achievement",
      title: "Achievement",
      detail: meetDetail(verdict, place),
    };
  }
  return null;
}

function aheadDetail(verdict, place) {
  if (place === "halfway") {
    return `The answers go past the October note (${verdict.assessment}). That note sits inside Year 10, and so does this result. It is ahead of the note. It is not above the usual Year 10 level for age 15.`;
  }
  if (place === "partial") {
    return `The answers go past the October note (${verdict.assessment}). The later question was beyond that note and still inside secondary chemistry. This is ahead of the note. It is not above the usual Year 10 level for age 15.`;
  }
  return `The answers are stronger than the October note (${verdict.assessment}). That note is below the usual Year 10 line for age 15. These answers pass the note. They do not show the subject is above Year 10.`;
}

function meetDetail(verdict, place) {
  if (place === "year") {
    return `The answers meet the October note (${verdict.assessment}). That is the Year 10 level expected at age 15. It does not go past that line.`;
  }
  return `The answers meet the October note (${verdict.assessment}). That is the expected place on this check. It is not a result above the usual Year 10 level for age 15.`;
}

export { rewardFor, yearPlace };
