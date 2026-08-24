// Trust lookup for the Business Trust Lookup experience.
//
// Uses the validated backend URL from config to construct safe requests.
// Falls back to a deterministic mock when no backend is configured (development).

import {
  clampScore,
  isValidBusinessId,
  normalizeBusinessId,
} from "@/lib/trust";
import { buildRequestUrl, validateConfig } from "@/lib/config";

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

// Check if a real backend is configured (not just mock mode).
function isBackendConfigured() {
  try {
    const { backendUrl } = validateConfig();
    return Boolean(backendUrl);
  } catch {
    return false;
  }
}

// Fetch trust score from the real backend using a safely constructed URL.
async function fetchFromBackend(businessId) {
  const normalized = normalizeBusinessId(businessId);
  // Build the request URL from validated config — prevents URL injection.
  const url = buildRequestUrl(
    `/api/v1/businesses/${encodeURIComponent(normalized)}/score`
  );

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Backend lookup failed (${response.status}). Please try again.`
    );
  }

  const data = await response.json();
  return {
    businessId: normalized,
    score: clampScore(data.score),
  };
}

// Async lookup. Uses the real backend when configured, otherwise falls back
// to a deterministic mock. Resolves to a { businessId, score } record, or
// rejects when the business id is invalid.
export async function lookupTrust(businessId) {
  const normalized = normalizeBusinessId(businessId);
  if (!isValidBusinessId(normalized)) {
    throw new Error("Enter a valid business ID (3-32 letters, numbers, or -).");
  }

  if (isBackendConfigured()) {
    return fetchFromBackend(normalized);
  }

  // Mock fallback for development without a backend.
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
  return {
    businessId: normalized,
    score: deriveMockScore(normalized),
  };
}
