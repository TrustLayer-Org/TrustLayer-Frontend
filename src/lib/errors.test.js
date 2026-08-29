import { describe, it, expect } from "vitest";
import {
  ErrorKind,
  TrustLookupError,
  fromHttpStatus,
  toClientError,
  validationError,
} from "@/lib/errors";

describe("error taxonomy — retryability", () => {
  it("marks user/terminal failures as NOT retryable", () => {
    expect(validationError().retryable).toBe(false); // invalid business id
    expect(fromHttpStatus(400).retryable).toBe(false);
    expect(fromHttpStatus(401).retryable).toBe(false);
    expect(fromHttpStatus(403).retryable).toBe(false);
    expect(fromHttpStatus(404).retryable).toBe(false);
  });

  it("marks transient failures as retryable", () => {
    expect(fromHttpStatus(429).retryable).toBe(true);
    expect(fromHttpStatus(500).retryable).toBe(true);
    expect(fromHttpStatus(503).retryable).toBe(true);
    expect(fromHttpStatus(408).retryable).toBe(true);
    expect(toClientError(new TypeError("fetch failed")).retryable).toBe(true);
    expect(toClientError(new SyntaxError("Unexpected token < in JSON")).retryable).toBe(true);
  });

  it("maps each documented status to the right kind", () => {
    expect(fromHttpStatus(400).kind).toBe(ErrorKind.VALIDATION);
    expect(fromHttpStatus(401).kind).toBe(ErrorKind.AUTH);
    expect(fromHttpStatus(403).kind).toBe(ErrorKind.AUTH);
    expect(fromHttpStatus(404).kind).toBe(ErrorKind.NOT_FOUND);
    expect(fromHttpStatus(429).kind).toBe(ErrorKind.RATE_LIMITED);
    expect(fromHttpStatus(500).kind).toBe(ErrorKind.SERVER);
    expect(fromHttpStatus(502).kind).toBe(ErrorKind.SERVER);
  });
});

describe("error taxonomy — normalization", () => {
  it("classifies timeout, abort, malformed JSON and network faults", () => {
    const abort = Object.assign(new Error("Aborted"), { name: "AbortError" });
    expect(toClientError(abort).kind).toBe(ErrorKind.CANCELLED);
    expect(toClientError(new Error("Request timed out")).kind).toBe(ErrorKind.TIMEOUT);
    expect(toClientError(new SyntaxError("Unexpected end of JSON input")).kind).toBe(
      ErrorKind.MALFORMED_RESPONSE,
    );
    expect(toClientError(new TypeError("Failed to fetch: network error")).kind).toBe(
      ErrorKind.NETWORK,
    );
    expect(toClientError("something odd").kind).toBe(ErrorKind.UNKNOWN);
  });

  it("passes through an already-normalized error unchanged", () => {
    const original = validationError("bad id");
    expect(toClientError(original)).toBe(original);
  });
});

describe("error taxonomy — safe messaging", () => {
  it("never surfaces server/internal detail in the user message", () => {
    const leaky =
      "PG::Error at /srv/app/db.rb:42 — connection string postgres://admin:s3cret@10.0.0.4/trust";
    const err = fromHttpStatus(500, { detail: leaky });

    expect(err.userMessage).not.toContain("postgres");
    expect(err.userMessage).not.toContain("s3cret");
    expect(err.userMessage).not.toContain("/srv/app");
    expect(err.userMessage).toBe("The trust service is having trouble. Please try again.");
    // Kept for diagnostics only, never rendered.
    expect(err.detail).toBe(leaky);
  });

  it("gives every error a correlation id for support, and unique per instance", () => {
    const a = fromHttpStatus(500);
    const b = fromHttpStatus(500);
    expect(a.correlationId).toMatch(/^TL-[0-9a-f]{6}$/);
    expect(a.correlationId).not.toBe(b.correlationId);
  });

  it("falls back to a safe message for an unknown kind", () => {
    const err = new TrustLookupError("NOT_A_REAL_KIND");
    expect(err.kind).toBe(ErrorKind.UNKNOWN);
    expect(err.userMessage).toBe("Something went wrong. Please try again.");
  });
});
