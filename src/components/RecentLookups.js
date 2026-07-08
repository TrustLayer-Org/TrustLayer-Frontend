import TrustBadge from "@/components/TrustBadge";

export default function RecentLookups({ history, onClear }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Recent lookups
        </p>
        {history.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            Clear
          </button>
        ) : null}
      </div>
      {history.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">
          Businesses you look up will show up here.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {history.map((entry) => (
            <li
              key={entry.businessId}
              className="flex items-center justify-between gap-3"
            >
              <span className="font-mono text-sm text-zinc-300">
                {entry.businessId}
              </span>
              <TrustBadge score={entry.score} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
