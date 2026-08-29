import { isValidBusinessId, normalizeBusinessId } from "@/lib/trust";
import {
  LookupResponseError,
  normalizeLookupRecord,
} from "@/lib/lookup-response.mjs";

const DEFAULT_API_BASE_PATH = "/api/v1";
const REQUEST_TIMEOUT_MS = 10000;

export const LOOKUP_API_BASE_URL =
  process.env.NEXT_PUBLIC_TRUST_API_BASE_URL || DEFAULT_API_BASE_PATH;

function buildLookupUrl(businessId) {
  const base = LOOKUP_API_BASE_URL.replace(/\/$/, "");
  return `${base}/businesses/${encodeURIComponent(businessId)}/score`;
}

function classifyHttpError(status) {
  if (status === 404) {
    return new LookupResponseError(
      "No verified trust record is available for this business.",
      { code: "NOT_FOUND", state: "unavailable", retryable: false }
    );
  }
  if (status === 429) {
    return new LookupResponseError(
      "The verification service is busy. Please retry shortly.",
      { code: "RATE_LIMITED", state: "error", retryable: true }
    );
  }
  if (status >= 500) {
    return new LookupResponseError(
      "The verification service is temporarily unavailable. Please retry.",
      { code: "SERVICE_UNAVAILABLE", state: "error", retryable: true }
    );
  }
  return new LookupResponseError(
    "The verification service rejected this lookup.",
    { code: "REQUEST_FAILED", state: "error", retryable: false }
  );
}

export async function lookupTrust(businessId, { signal } = {}) {
  const normalized = normalizeBusinessId(businessId);
  if (!isValidBusinessId(normalized)) {
    throw new LookupResponseError(
      "Enter a valid business ID (3-32 letters, numbers, or -).",
      { code: "INVALID_BUSINESS_ID", state: "error", retryable: false }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const abortHandler = () => controller.abort();
  signal?.addEventListener("abort", abortHandler, { once: true });

  try {
    const response = await fetch(buildLookupUrl(normalized), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw classifyHttpError(response.status);
    }

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new LookupResponseError("The verification service returned invalid JSON.");
    }

    return normalizeLookupRecord(payload, normalized);
  } catch (error) {
    if (error?.name === "AbortError") {
      if (signal?.aborted) {
        throw error;
      }
      throw new LookupResponseError(
        "The verification request timed out. Please retry.",
        { code: "TIMEOUT", state: "error", retryable: true }
      );
    }
    if (error instanceof LookupResponseError) {
      throw error;
    }
    throw new LookupResponseError(
      "The verification service could not be reached. Please retry.",
      { code: "NETWORK_ERROR", state: "error", retryable: true }
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abortHandler);
  }

  if (isBackendConfigured()) {
    return fetchFromBackend(normalized);
  }

  // Mock fallback for development without a backend.
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
  return {
    businessId: normalized,
    score: deriveMockScore(normalized),
    provenance: "mock:v1",
    lookedUpAt: new Date().toISOString(),
  };
}
