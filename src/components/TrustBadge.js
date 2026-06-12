import { clampScore, scoreToColorClass, scoreToLabel } from "@/lib/trust";

export default function TrustBadge({ score }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${scoreToColorClass(
        score
      )}`}
    >
      <span>{scoreToLabel(score)}</span>
      <span className="opacity-70">{clampScore(score)}</span>
    </span>
  );
}
