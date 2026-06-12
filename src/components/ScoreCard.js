import TrustBadge from "@/components/TrustBadge";
import { formatScore } from "@/lib/trust";

export default function ScoreCard({ businessId, score }) {
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
      </div>
    </div>
  );
}
