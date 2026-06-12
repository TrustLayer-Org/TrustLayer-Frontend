export default function ScoreCard({ businessId }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        Business ID
      </p>
      <p className="mt-1 font-mono text-sm text-zinc-200">{businessId}</p>
    </div>
  );
}
