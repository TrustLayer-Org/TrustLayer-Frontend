import { nextTierGap, nextTierLabel } from "@/lib/trust";

export default function NextTierHint({ score }) {
  const gap = nextTierGap(score);
  const label = nextTierLabel(score);
  return (
    <p className="text-xs text-zinc-500">
      {gap} points to {label}
    </p>
  );
}
