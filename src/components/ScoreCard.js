import TrustBadge from "@/components/TrustBadge";
import ScoreMeter from "@/components/ScoreMeter";
import NextTierHint from "@/components/NextTierHint";
import ShareResultButton from "@/components/ShareResultButton";
import { formatScore, scoreToLabel } from "@/lib/trust";

const TIER_COPY = {
  Untrusted: "No reliable trust signals were found for this business.",
  Low: "Limited on-chain history. Proceed with caution.",
  Moderate: "Some positive signals, but trust is still developing.",
  High: "Strong on-chain reputation and consistent activity.",
  Excellent: "Exceptional trust standing across all measured signals.",
};

const STATUS_COPY = {
  unavailable: {
    label: "Verification unavailable",
    message: "No authoritative score is available for this business.",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  },
  stale: {
    label: "Verification is stale",
    message: "The service returned an older result. Treat this score as unverified until refreshed.",
    className: "border-orange-500/30 bg-orange-500/10 text-orange-200",
  },
  error: {
    label: "Verification failed",
    message: "The score could not be verified. No fallback score is shown.",
    className: "border-red-500/30 bg-red-500/10 text-red-200",
  },
};

function Provenance({ result }) {
  return (
    <dl className="mt-4 grid gap-2 border-t border-zinc-800 pt-4 text-xs text-zinc-400 sm:grid-cols-3">
      <div>
        <dt className="uppercase tracking-wide text-zinc-600">Source</dt>
        <dd className="mt-1 text-zinc-300">{result.source}</dd>
      </div>
      <div>
        <dt className="uppercase tracking-wide text-zinc-600">Calculation</dt>
        <dd className="mt-1 text-zinc-300">{result.calculationVersion}</dd>
      </div>
      <div>
        <dt className="uppercase tracking-wide text-zinc-600">Verified at</dt>
        <dd className="mt-1 text-zinc-300">{result.verifiedAt || "Not provided"}</dd>
      </div>
    </dl>
  );
}

export default function ScoreCard({ result, onRetry }) {
  const businessId = result?.businessId || "—";
  const state = result?.state || "error";

  if (state !== "verified") {
    const status = STATUS_COPY[state] || STATUS_COPY.error;
    return (
      <div
        className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6"
        aria-live="polite"
        aria-label={`${status.label} for ${businessId}`}
      >
        <p className="text-xs uppercase tracking-wide text-zinc-500">Business ID</p>
        <p className="mt-1 font-mono text-sm text-zinc-200">{businessId}</p>
        <div className={`mt-4 rounded-md border p-4 ${status.className}`}>
          <p className="font-medium">{status.label}</p>
          <p className="mt-1 text-sm">{result?.message || status.message}</p>
        </div>
        {result?.retryable && onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-500"
          >
            Retry verification
          </button>
        ) : null}
      </div>
    );
  }

  const label = scoreToLabel(result.score);
  return (
    <div
      className="rounded-lg border border-emerald-500/30 bg-zinc-900/50 p-6"
      aria-live="polite"
      aria-label={`Verified score for ${businessId}, ${formatScore(result.score)}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Business ID</p>
          <p className="mt-1 font-mono text-sm text-zinc-200">{businessId}</p>
        </div>
        <TrustBadge score={result.score} />
      </div>
      <div className="mt-4">
        <p className="text-xs uppercase tracking-wide text-emerald-300">Verified score</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-zinc-100">
          {formatScore(result.score)}
        </p>
        <div className="mt-3">
          <ScoreMeter score={result.score} />
        </div>
        <p className="mt-2 text-sm text-zinc-400">{TIER_COPY[label]}</p>
        <Provenance result={result} />
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-800 pt-3">
          <NextTierHint score={result.score} />
          <ShareResultButton businessId={businessId} score={result.score} />
        </div>
      </div>
    </div>
  );
}
