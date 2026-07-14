import { isTopTier, nextTierGap, nextTierLabel } from "@/lib/trust";

export default function NextTierHint({ score }) {
  if (score === undefined || score === null) {
    return null;
  }
  if (isTopTier(score)) {
    return (
      <p className="text-xs text-zinc-500">
        Already at the top trust tier.
      </p>
    );
  }
  const gap = nextTierGap(score);
  const label = nextTierLabel(score);
  return (
    <p className="text-xs text-zinc-500">
      {gap} points to {label}
    </p>
  );
}
