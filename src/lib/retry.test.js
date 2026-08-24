import { describe, it, expect, vi } from "vitest";
import { withRetry, backoffDelay, DEFAULT_MAX_ATTEMPTS } from "@/lib/retry";
import { ErrorKind, fromHttpStatus, validationError } from "@/lib/errors";

const fast = { baseDelayMs: 0, maxDelayMs: 0 };

describe("withRetry — selective retries", () => {
  it("does NOT retry a validation error (acceptance criterion)", async () => {
    const fn = vi.fn().mockRejectedValue(validationError("bad id"));
    await expect(withRetry(fn, fast)).rejects.toMatchObject({ kind: ErrorKind.VALIDATION });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does NOT retry auth or not-found failures", async () => {
    for (const status of [401, 403, 404]) {
      const fn = vi.fn().mockRejectedValue(fromHttpStatus(status));
      await expect(withRetry(fn, fast)).rejects.toBeTruthy();
      expect(fn).toHaveBeenCalledTimes(1);
    }
  });

  it("retries transient 5xx and recovers", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(fromHttpStatus(503))
      .mockResolvedValueOnce({ businessId: "acme-1", score: 72 });

    await expect(withRetry(fn, fast)).resolves.toEqual({ businessId: "acme-1", score: 72 });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("retries network and malformed-JSON failures", async () => {
    for (const err of [new TypeError("fetch failed"), new SyntaxError("bad JSON")]) {
      const fn = vi.fn().mockRejectedValueOnce(err).mockResolvedValueOnce("ok");
      await expect(withRetry(fn, fast)).resolves.toBe("ok");
      expect(fn).toHaveBeenCalledTimes(2);
    }
  });
});

describe("withRetry — bounded", () => {
  it("stops at the attempt cap and surfaces the last error", async () => {
    const fn = vi.fn().mockRejectedValue(fromHttpStatus(500));
    await expect(withRetry(fn, fast)).rejects.toMatchObject({ kind: ErrorKind.SERVER });
    expect(fn).toHaveBeenCalledTimes(DEFAULT_MAX_ATTEMPTS);
  });

  it("honours a custom attempt budget", async () => {
    const fn = vi.fn().mockRejectedValue(fromHttpStatus(500));
    await expect(withRetry(fn, { ...fast, maxAttempts: 5 })).rejects.toBeTruthy();
    expect(fn).toHaveBeenCalledTimes(5);
  });

  it("respects a server Retry-After over computed backoff (429)", async () => {
    const delays = [];
    const fn = vi
      .fn()
      .mockRejectedValueOnce(fromHttpStatus(429, { retryAfterMs: 1234 }))
      .mockResolvedValueOnce("ok");

    await withRetry(fn, {
      ...fast,
      onRetry: ({ delay }) => delays.push(delay),
    });
    expect(delays).toEqual([1234]);
  });
});

describe("backoffDelay", () => {
  it("grows exponentially and stays capped", () => {
    const random = () => 1; // full jitter at maximum
    expect(backoffDelay(0, { baseDelayMs: 100, maxDelayMs: 4000, random })).toBe(100);
    expect(backoffDelay(1, { baseDelayMs: 100, maxDelayMs: 4000, random })).toBe(200);
    expect(backoffDelay(2, { baseDelayMs: 100, maxDelayMs: 4000, random })).toBe(400);
    expect(backoffDelay(9, { baseDelayMs: 100, maxDelayMs: 4000, random })).toBe(4000); // capped
  });

  it("applies jitter below the ceiling", () => {
    const delay = backoffDelay(3, { baseDelayMs: 100, maxDelayMs: 4000, random: () => 0.25 });
    expect(delay).toBe(200); // 0.25 * 800
  });
});

describe("withRetry — cancellation", () => {
  it("stops immediately when the signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const fn = vi.fn();

    await expect(withRetry(fn, { ...fast, signal: controller.signal })).rejects.toMatchObject({
      kind: ErrorKind.CANCELLED,
    });
    expect(fn).not.toHaveBeenCalled();
  });

  it("aborts mid-backoff instead of running the next attempt", async () => {
    const controller = new AbortController();
    const fn = vi.fn().mockRejectedValue(fromHttpStatus(500));

    const promise = withRetry(fn, {
      baseDelayMs: 50,
      maxDelayMs: 50,
      random: () => 1,
      signal: controller.signal,
    });
    // Let the first attempt fail, then cancel during the wait.
    await new Promise((r) => setTimeout(r, 10));
    controller.abort();

    await expect(promise).rejects.toMatchObject({ kind: ErrorKind.CANCELLED });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
