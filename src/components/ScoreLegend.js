import { TIER_THRESHOLDS } from "@/lib/trust";

export default function ScoreLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
      {TIER_THRESHOLDS.map((tier) => (
        <li key={tier.label} className="flex items-center gap-1.5">
          <span className="font-medium text-zinc-400">{tier.label}</span>
          <span>{tier.min}+</span>
        </li>
      ))}
    </ul>
  );
}
