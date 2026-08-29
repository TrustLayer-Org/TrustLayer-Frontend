import assert from "node:assert/strict";
import test from "node:test";
import {
  LookupResponseError,
  normalizeLookupRecord,
} from "../src/lib/lookup-response.mjs";

test("normalizes a verified backend response with provenance", () => {
  const record = normalizeLookupRecord(
    {
      score: 87.4,
      source: "stellar-indexer",
      calculation_version: "2026.08",
      verification_status: "verified",
      freshness: "fresh",
      verified_at: "2026-08-24T08:00:00Z",
    },
    " acme-123 "
  );

  assert.deepEqual(record, {
    businessId: "ACME-123",
    score: 87,
    source: "stellar-indexer",
    calculationVersion: "2026.08",
    freshness: "fresh",
    verificationStatus: "verified",
    verifiedAt: "2026-08-24T08:00:00Z",
    state: "verified",
  });
});

test("marks stale verified data as stale instead of authoritative", () => {
  const record = normalizeLookupRecord(
    {
      score: 63,
      source: "cache",
      calculationVersion: "2026.07",
      verificationStatus: "verified",
      freshness: "stale",
    },
    "ACME-123"
  );

  assert.equal(record.state, "stale");
  assert.equal(record.verifiedAt, null);
});

test("marks unverified and unavailable responses as unavailable", () => {
  const record = normalizeLookupRecord(
    {
      score: 0,
      source: "backend",
      calculationVersion: "2026.08",
      verificationStatus: "unverified",
      freshness: "unavailable",
    },
    "ACME-123"
  );

  assert.equal(record.state, "unavailable");
});

test("rejects malformed responses instead of manufacturing a score", () => {
  assert.throws(
    () =>
      normalizeLookupRecord(
        { score: "not-a-score", source: "mock", calculationVersion: "local" },
        "ACME-123"
      ),
    (error) => error instanceof LookupResponseError && error.code === "MALFORMED_RESPONSE"
  );
});

test("rejects scores outside the service contract", () => {
  assert.throws(
    () =>
      normalizeLookupRecord(
        {
          score: 101,
          source: "backend",
          calculationVersion: "2026.08",
          verificationStatus: "verified",
          freshness: "fresh",
        },
        "ACME-123"
      ),
    LookupResponseError
  );
});
