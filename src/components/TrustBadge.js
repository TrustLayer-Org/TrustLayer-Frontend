import {
  clampScore,
  describeScore,
  scoreToColorClass,
  scoreToLabel,
} from "@/lib/trust";

export default function TrustBadge({ score }) {
  const label = scoreToLabel(score);
  return (
    <span
      role="status"
      aria-label={`Trust tier ${describeScore(score)}`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${scoreToColorClass(
        score
      )}`}
    >
      <span>{label}</span>
      <span className="opacity-70">{clampScore(score)}</span>
    </span>
  );
}
