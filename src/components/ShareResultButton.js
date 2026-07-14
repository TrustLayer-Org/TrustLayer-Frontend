"use client";

import { buildShareSummary } from "@/lib/trust";

// Copy text to the clipboard, falling back to a hidden textarea when the
// Clipboard API is unavailable (older browsers, insecure contexts).
async function copyToClipboard(text) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export default function ShareResultButton({ businessId, score }) {
  async function handleClick() {
    const summary = buildShareSummary(businessId, score);
    await copyToClipboard(summary);
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
