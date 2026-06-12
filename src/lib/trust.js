// Pure helper functions for working with business trust scores.
// Scores are integers in the range 0-100.

export function clampScore(score) {
  const n = Number(score);
  if (Number.isNaN(n)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function scoreToLabel(score) {
  const n = clampScore(score);
  if (n < 20) {
    return "Untrusted";
  }
  if (n < 40) {
    return "Low";
  }
  if (n < 60) {
    return "Moderate";
  }
  if (n < 80) {
    return "High";
  }
  return "Excellent";
}
