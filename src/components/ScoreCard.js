import TrustBadge from "@/components/TrustBadge";
import ScoreMeter from "@/components/ScoreMeter";
import { formatScore, scoreToLabel } from "@/lib/trust";

const TIER_COPY = {
  Untrusted: "No reliable trust signals were found for this business.",
  Low: "Limited on-chain history. Proceed with caution.",
  Moderate: "Some positive signals, but trust is still developing.",
  High: "Strong on-chain reputation and consistent activity.",
  Excellent: "Exceptional trust standing across all measured signals.",
};

export default function ScoreCard({ businessId = "—", score = 0 }) {
  const label = scoreToLabel(score);
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Business ID
          </p>
          <p className="mt-1 font-mono text-sm text-zinc-200">{businessId}</p>
        </div>
        <TrustBadge score={score} />
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold tracking-tight text-zinc-100">
          {formatScore(score)}
        </p>
        <div className="mt-3">
          <ScoreMeter score={score} />
        </div>
        <p className="mt-2 text-sm text-zinc-400">{TIER_COPY[label]}</p>
      </div>
    </div>
  );
}
