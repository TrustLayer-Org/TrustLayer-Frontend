import { clampScore, scoreToBarClass } from "@/lib/trust";

export default function ScoreMeter({ score }) {
  const value = clampScore(score);
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2 w-full overflow-hidden rounded-full bg-zinc-800"
    >
      <div
        className={`h-full rounded-full ${scoreToBarClass(score)}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
