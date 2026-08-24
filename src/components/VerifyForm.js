"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ScoreCard from "@/components/ScoreCard";
import RecentLookups from "@/components/RecentLookups";
import { lookupTrust } from "@/lib/lookup";
import { ErrorKind, toClientError } from "@/lib/errors";
import { useLookupHistory } from "@/lib/useLookupHistory";

export default function VerifyForm() {
  const [businessId, setBusinessId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  // Holds a normalized TrustLookupError (never a raw Error) or null.
  const [error, setError] = useState(null);
  const { history, recordLookup, clear: handleClearHistory } =
    useLookupHistory();

  // The id the failure belongs to, so "Try again" re-runs the same lookup even
  // if the user has since edited the field.
  const lastAttemptedId = useRef("");
  const abortRef = useRef(null);
  const errorRef = useRef(null);

  // Cancel any in-flight lookup when the form unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Move focus to the message so screen readers and keyboard users land on it.
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  function handleChange(event) {
    setBusinessId(event.target.value);
    if (error) {
      setError(null);
    }
  }

  const runLookup = useCallback(
    async (id) => {
      // Supersede any in-flight request so responses can't arrive out of order.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      lastAttemptedId.current = id;
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const record = await lookupTrust(id, { signal: controller.signal });
        setResult(record);
        recordLookup(record);
      } catch (err) {
        const clientError = toClientError(err);
        // A cancelled lookup was superseded deliberately — not a user-facing failure.
        if (clientError.kind !== ErrorKind.CANCELLED) setError(clientError);
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          setLoading(false);
        }
      }
    },
    [recordLookup],
  );

  async function handleSubmit(event) {
    event.preventDefault();
    await runLookup(businessId);
  }

  function handleRetry() {
    runLookup(lastAttemptedId.current || businessId);
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
      {error ? (
        <div
          role="alert"
          aria-live="assertive"
          tabIndex={-1}
          ref={errorRef}
          className="space-y-2 rounded-md border border-red-900/60 bg-red-950/30 p-3 focus:outline-none focus:ring-1 focus:ring-red-500"
        >
          {/* Safe copy from the error taxonomy — never a raw server message. */}
          <p className="text-sm text-red-400">{error.userMessage}</p>
          {error.retryable ? (
            <button
              type="button"
              onClick={handleRetry}
              disabled={loading}
              className="rounded-md border border-red-800 px-3 py-1 text-xs font-medium text-red-200 hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Retrying…" : "Try again"}
            </button>
          ) : null}
          <p className="text-xs text-zinc-500">
            Reference: <span className="font-mono">{error.correlationId}</span>
          </p>
        </div>
      ) : null}
      {result ? (
        <ScoreCard businessId={result.businessId} score={result.score} />
      ) : null}
      <RecentLookups
        history={history}
        onClear={handleClearHistory}
        onSelect={handleSelectHistory}
      />
    </form>
  );
}
