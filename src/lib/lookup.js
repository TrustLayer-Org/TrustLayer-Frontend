// Mock trust lookup for the Business Trust Lookup experience.
//
// PLACEHOLDER: this module returns a deterministic mock score derived from the
// business id. Replace `lookupTrust` with a real call to the backend endpoint
// `GET /api/v1/businesses/:id/score` when it is available.

import {
  clampScore,
  isValidBusinessId,
  normalizeBusinessId,
} from "@/lib/trust";
import { validationError } from "@/lib/errors";
import { withRetry } from "@/lib/retry";

// Simulated network latency for the mock lookup, in milliseconds.
const MOCK_LATENCY_MS = 600;

// Deterministically derive a 0-100 score from a business id so the same id
// always yields the same mock result.
export function deriveMockScore(businessId) {
  const normalized = normalizeBusinessId(businessId);
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) % 101;
  }
  return clampScore(hash);
}

// The single round-trip. Kept separate from `lookupTrust` so the retry policy
// wraps exactly one attempt — and so swapping the mock for the real
// `GET /api/v1/businesses/:id/score` call only touches this function.
async function fetchTrustRecord(normalized, { signal } = {}) {
  await new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(resolve, MOCK_LATENCY_MS);
    signal?.addEventListener?.(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });

  return {
    businessId: normalized,
    score: deriveMockScore(normalized),
  };
}

/**
 * Look up a business trust record.
 *
 * Validation is checked *before* any attempt, so an invalid id fails fast as a
 * terminal error and never consumes a retry. Transient failures are retried
 * with bounded backoff (see lib/retry). Rejects with a `TrustLookupError`.
 *
 * @param {string} businessId
 * @param {{signal?: AbortSignal, maxAttempts?: number, onRetry?: Function}} [options]
 */
export async function lookupTrust(businessId, options = {}) {
  const normalized = normalizeBusinessId(businessId);

  // Terminal: retrying a malformed id can only produce the same failure.
  if (!isValidBusinessId(normalized)) {
    throw validationError(`rejected business id: ${JSON.stringify(businessId)}`);
  }

  const { signal, maxAttempts, onRetry } = options;
  return withRetry(() => fetchTrustRecord(normalized, { signal }), {
    signal,
    maxAttempts,
    onRetry,
  });
}
