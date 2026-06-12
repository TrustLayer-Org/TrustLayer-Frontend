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

export function scoreToColorClass(score) {
  const n = clampScore(score);
  if (n < 20) {
    return "text-red-300 bg-red-500/10 border-red-500/30";
  }
  if (n < 40) {
    return "text-orange-300 bg-orange-500/10 border-orange-500/30";
  }
  if (n < 60) {
    return "text-amber-300 bg-amber-500/10 border-amber-500/30";
  }
  if (n < 80) {
    return "text-lime-300 bg-lime-500/10 border-lime-500/30";
  }
  return "text-emerald-300 bg-emerald-500/10 border-emerald-500/30";
}
