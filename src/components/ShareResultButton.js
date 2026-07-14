"use client";

import { useState } from "react";
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
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const summary = buildShareSummary(businessId, score);
    await copyToClipboard(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-md border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
    >
      {copied ? "Copied" : "Share"}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Result copied to clipboard" : ""}
      </span>
    </button>
  );
}
