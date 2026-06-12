// Pure helper functions for working with business trust scores.
// Scores are integers in the range 0-100.

export const TIER_THRESHOLDS = [
  { min: 0, label: "Untrusted" },
  { min: 20, label: "Low" },
  { min: 40, label: "Moderate" },
  { min: 60, label: "High" },
  { min: 80, label: "Excellent" },
];

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

export function formatScore(score) {
  return `${clampScore(score)}/100`;
}

export function normalizeBusinessId(input) {
  return String(input ?? "")
    .trim()
    .toUpperCase();
}

export function isValidBusinessId(id) {
  const normalized = normalizeBusinessId(id);
  return /^[A-Z0-9-]{3,32}$/.test(normalized);
}

export function tierForScore(score) {
  const n = clampScore(score);
  let tier = TIER_THRESHOLDS[0];
  for (const candidate of TIER_THRESHOLDS) {
    if (n >= candidate.min) {
      tier = candidate;
    }
  }
  return tier;
}

export function scoreToPercent(score) {
  return clampScore(score) / 100;
}

export function scoreToBarClass(score) {
  const n = clampScore(score);
  if (n < 20) {
    return "bg-red-500";
  }
  if (n < 40) {
    return "bg-orange-500";
  }
  if (n < 60) {
    return "bg-amber-500";
  }
  if (n < 80) {
    return "bg-lime-500";
  }
  return "bg-emerald-500";
}

export const PASSING_SCORE = 60;

export function isPassingScore(score) {
  return clampScore(score) >= PASSING_SCORE;
}

export function isFailingScore(score) {
  return clampScore(score) < PASSING_SCORE;
}

export function tierIndex(score) {
  const n = clampScore(score);
  let index = 0;
  for (let i = 0; i < TIER_THRESHOLDS.length; i += 1) {
    if (n >= TIER_THRESHOLDS[i].min) {
      index = i;
    }
  }
  return index;
}

export function describeScore(score) {
  return `${scoreToLabel(score)} (${formatScore(score)})`;
}

export function scoreGrade(score) {
  const n = clampScore(score);
  if (n >= 80) {
    return "A";
  }
  if (n >= 60) {
    return "B";
  }
  if (n >= 40) {
    return "C";
  }
  if (n >= 20) {
    return "D";
  }
  return "F";
}
