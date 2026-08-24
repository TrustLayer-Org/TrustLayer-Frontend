import { describe, it, expect, vi } from "vitest";
import { lookupTrust, deriveMockScore } from "@/lib/lookup";
import { ErrorKind } from "@/lib/errors";

describe("lookupTrust — validation is terminal", () => {
  it("rejects an invalid business id as a non-retryable validation error", async () => {
    const onRetry = vi.fn();
    await expect(lookupTrust("!!", { onRetry })).rejects.toMatchObject({
      kind: ErrorKind.VALIDATION,
      retryable: false,
    });
    // Criterion: validation errors do not trigger retries.
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("rejects empty and over-long ids without retrying", async () => {
    const onRetry = vi.fn();
    for (const bad of ["", "  ", "ab", "x".repeat(33)]) {
      await expect(lookupTrust(bad, { onRetry })).rejects.toMatchObject({
        kind: ErrorKind.VALIDATION,
      });
    }
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("never leaks the raw input back as user-facing copy", async () => {
    const injected = "<script>alert(1)</script>";
    const err = await lookupTrust(injected).catch((e) => e);
    expect(err.userMessage).not.toContain("<script>");
    expect(err.detail).toContain("script"); // kept internally only
  });
});

describe("lookupTrust — success path", () => {
  it("resolves a deterministic record for a valid id", async () => {
    const record = await lookupTrust("ACME-123");
    expect(record.businessId).toBe("ACME-123");
    expect(record.score).toBe(deriveMockScore("ACME-123"));
    expect(record.score).toBeGreaterThanOrEqual(0);
    expect(record.score).toBeLessThanOrEqual(100);
  });

  it("normalizes the id so the canonical form is returned", async () => {
    const a = await lookupTrust("  Acme-123  ");
    const b = await lookupTrust("acme-123"); // different case, same canonical id
    expect(a.businessId).toBe(b.businessId);
    expect(a.score).toBe(b.score);
  });
});

describe("lookupTrust — cancellation", () => {
  it("rejects with CANCELLED when aborted in flight", async () => {
    const controller = new AbortController();
    const promise = lookupTrust("acme-123", { signal: controller.signal });
    controller.abort();
    await expect(promise).rejects.toMatchObject({ kind: ErrorKind.CANCELLED });
  });

  it("rejects immediately when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      lookupTrust("acme-123", { signal: controller.signal }),
    ).rejects.toMatchObject({ kind: ErrorKind.CANCELLED });
  });
});
