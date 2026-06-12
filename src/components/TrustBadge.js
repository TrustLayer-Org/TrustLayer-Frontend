import { scoreToColorClass, scoreToLabel } from "@/lib/trust";

export default function TrustBadge({ score }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${scoreToColorClass(
        score
      )}`}
    >
      {scoreToLabel(score)}
    </span>
  );
}
