const MAX_SCORE = 100;

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export class LookupResponseError extends Error {
  constructor(message, { code = "MALFORMED_RESPONSE", state = "error", retryable = false } = {}) {
    super(message);
    this.name = "LookupResponseError";
    this.code = code;
    this.state = state;
    this.retryable = retryable;
  }
}

export function normalizeLookupRecord(payload, businessId) {
  const data = payload && typeof payload === "object" && payload.data ? payload.data : payload;
  const score = Number(data?.score);
  const source = normalizeText(data?.source);
  const calculationVersion = normalizeText(
    data?.calculationVersion ?? data?.calculation_version
  );
  const verificationStatus = normalizeText(
    data?.verificationStatus ?? data?.verification_status
  ).toLowerCase();
  const freshness = normalizeText(data?.freshness).toLowerCase();
  const verifiedAt = normalizeText(data?.verifiedAt ?? data?.verified_at);

  if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE) {
    throw new LookupResponseError("The verification service returned an invalid score.");
  }
  if (!source || !calculationVersion) {
    throw new LookupResponseError(
      "The verification service returned incomplete provenance data."
    );
  }
  if (!["verified", "unverified"].includes(verificationStatus)) {
    throw new LookupResponseError("The verification service returned an invalid verification state.");
  }
  if (!["fresh", "stale", "unavailable"].includes(freshness)) {
    throw new LookupResponseError("The verification service returned an invalid freshness state.");
  }

  const normalizedBusinessId = normalizeText(businessId).toUpperCase();
  const state = verificationStatus !== "verified"
    ? "unavailable"
    : freshness === "stale"
      ? "stale"
      : freshness === "unavailable"
        ? "unavailable"
        : "verified";

  return {
    businessId: normalizedBusinessId,
    score: Math.min(MAX_SCORE, Math.max(0, Math.round(score))),
    source,
    calculationVersion,
    freshness,
    verificationStatus,
    verifiedAt: verifiedAt || null,
    state,
  };
}
