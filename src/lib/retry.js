// Bounded retry for the verify flow.
//
// Retries are *bounded* (a hard attempt cap), *selective* (only errors the
// taxonomy marks retryable — a bad business id is never retried), and
// *cancellable* (an AbortSignal stops both the wait and further attempts).

import { ErrorKind, TrustLookupError, toClientError } from "@/lib/errors";

export const DEFAULT_MAX_ATTEMPTS = 3; // 1 initial try + 2 retries
export const DEFAULT_BASE_DELAY_MS = 300;
export const DEFAULT_MAX_DELAY_MS = 4000;

/**
 * Exponential backoff with full jitter, capped. Jitter avoids a thundering
 * herd when many clients fail at the same moment.
 */
export function backoffDelay(attempt, {
  baseDelayMs = DEFAULT_BASE_DELAY_MS,
  maxDelayMs = DEFAULT_MAX_DELAY_MS,
  random = Math.random,
} = {}) {
  const exponential = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
  return Math.round(random() * exponential);
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new TrustLookupError(ErrorKind.CANCELLED, { detail: "aborted before delay" }));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener?.("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(new TrustLookupError(ErrorKind.CANCELLED, { detail: "aborted during backoff" }));
    }
    signal?.addEventListener?.("abort", onAbort, { once: true });
  });
}

/**
 * Run `fn` with bounded, selective retries.
 *
 * @param {(meta: {attempt: number}) => Promise<any>} fn
 * @returns the resolved value, or throws a normalized TrustLookupError.
 */
export async function withRetry(fn, {
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  baseDelayMs = DEFAULT_BASE_DELAY_MS,
  maxDelayMs = DEFAULT_MAX_DELAY_MS,
  signal,
  random,
  onRetry,
} = {}) {
  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (signal?.aborted) {
      throw new TrustLookupError(ErrorKind.CANCELLED, { detail: "aborted before attempt" });
    }
    try {
      return await fn({ attempt });
    } catch (err) {
      const clientError = toClientError(err);
      lastError = clientError;

      // Terminal (validation, auth, not-found) or cancelled: stop immediately.
      if (!clientError.retryable || clientError.kind === ErrorKind.CANCELLED) throw clientError;
      // Attempt budget exhausted.
      if (attempt === maxAttempts - 1) throw clientError;

      // Honour a server-provided Retry-After when present (429).
      const delay = clientError.retryAfterMs ??
        backoffDelay(attempt, { baseDelayMs, maxDelayMs, random });
      onRetry?.({ attempt: attempt + 1, delay, error: clientError });
      await sleep(delay, signal);
    }
  }

  throw lastError;
}
