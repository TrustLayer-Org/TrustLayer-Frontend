"use client";

import { buildShareSummary } from "@/lib/trust";

export default function ShareResultButton({ businessId, score }) {
  async function handleClick() {
    const summary = buildShareSummary(businessId, score);
    await navigator.clipboard.writeText(summary);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-xs text-zinc-500 hover:text-zinc-300"
    >
      Share
    </button>
  );
}
