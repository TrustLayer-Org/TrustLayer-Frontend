// Pure helper functions for working with business trust scores.
// Scores are integers in the range 0-100.

export function clampScore(score) {
  const n = Number(score);
  if (Number.isNaN(n)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(n)));
}
