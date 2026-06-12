// Mock trust lookup for the Business Trust Lookup experience.
//
// PLACEHOLDER: this module returns a deterministic mock score derived from the
// business id. Replace `lookupTrust` with a real call to the backend endpoint
// `GET /api/v1/businesses/:id/score` when it is available.

import { clampScore, normalizeBusinessId } from "@/lib/trust";

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

// Async mock lookup. Resolves to a { businessId, score } record.
export async function lookupTrust(businessId) {
  const normalized = normalizeBusinessId(businessId);
  return {
    businessId: normalized,
    score: deriveMockScore(normalized),
  };
}
