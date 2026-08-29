"use client";

import { useEffect, useRef, useState } from "react";
import ScoreCard from "@/components/ScoreCard";
import RecentLookups from "@/components/RecentLookups";
import { lookupTrust } from "@/lib/lookup";
import { normalizeBusinessId } from "@/lib/trust";
import { useLookupHistory } from "@/lib/useLookupHistory";

export default function VerifyForm() {
  const [businessId, setBusinessId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);
  const activeController = useRef(null);
  const { history, recordLookup, clear: handleClearHistory } =
    useLookupHistory();

  useEffect(() => {
    return () => {
      requestId.current += 1;
      activeController.current?.abort();
    };
  }, []);

  function handleChange(event) {
    requestId.current += 1;
    activeController.current?.abort();
    activeController.current = null;
    setBusinessId(event.target.value);
    setResult(null);
    setLoading(false);
  }

  async function runLookup(id) {
    const currentRequestId = requestId.current + 1;
    requestId.current = currentRequestId;
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    const normalized = normalizeBusinessId(id);
    setLoading(true);
    setResult(null);

    try {
      const record = await lookupTrust(normalized, { signal: controller.signal });
      if (requestId.current !== currentRequestId) {
        return;
      }
      setResult(record);
      if (record.state === "verified") {
        recordLookup(record);
      }
    } catch (err) {
      if (requestId.current !== currentRequestId || err?.name === "AbortError") {
        return;
      }
      setResult({
        businessId: normalized,
        state: err.state || "error",
        message: err.message || "The verification service could not be reached. Please retry.",
        retryable: Boolean(err.retryable),
      });
    } finally {
      if (requestId.current === currentRequestId) {
        setLoading(false);
        activeController.current = null;
      }
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await runLookup(businessId);
  }

  function handleSelectHistory(id) {
    setBusinessId(id);
    runLookup(id);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label
          htmlFor="businessId"
          className="block text-sm font-medium text-zinc-300"
        >
          Business ID
        </label>
        <input
          id="businessId"
          name="businessId"
          type="text"
          value={businessId}
          onChange={handleChange}
          aria-describedby="businessId-hint"
          placeholder="e.g. ACME-123"
          className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
        />
        <p id="businessId-hint" className="mt-1 text-xs text-zinc-500">
          3-32 letters, numbers, or hyphens.
        </p>
      </div>
      <button
        type="submit"
        disabled={loading || businessId.trim() === ""}
        className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Verifying…" : "Verify"}
      </button>
      {result ? (
        <ScoreCard result={result} onRetry={() => runLookup(businessId)} />
      ) : null}
      <RecentLookups
        history={history}
        onClear={handleClearHistory}
        onSelect={handleSelectHistory}
      />
    </form>
  );
}
