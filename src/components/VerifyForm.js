"use client";

import { useState } from "react";
import ScoreCard from "@/components/ScoreCard";
import { lookupTrust } from "@/lib/lookup";

export default function VerifyForm() {
  const [businessId, setBusinessId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    setBusinessId(event.target.value);
    if (error) {
      setError("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const record = await lookupTrust(businessId);
      setResult(record);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
          placeholder="e.g. ACME-123"
          className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading || businessId.trim() === ""}
        className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Verifying…" : "Verify"}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : null}
      {result ? (
        <ScoreCard businessId={result.businessId} score={result.score} />
      ) : null}
    </form>
  );
}
