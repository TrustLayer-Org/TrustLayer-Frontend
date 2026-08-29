// Typed client errors for the verify flow.
//
// Two jobs:
//   1. Classify failures as retryable (transient) or terminal, so bounded
//      retries never fire on a user mistake like an invalid business id.
//   2. Separate the *safe* message shown to a user from the internal detail
//      kept for diagnostics — server/internal text is never rendered.
//
// Every error carries a correlationId so a report ("code TL-3f9c2a") can be
// matched to logs without exposing internals in the UI.

/** Stable, machine-readable failure kinds. */
export const ErrorKind = {
  VALIDATION: "VALIDATION",
  AUTH: "AUTH",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  SERVER: "SERVER",
  NETWORK: "NETWORK",
  TIMEOUT: "TIMEOUT",
  MALFORMED_RESPONSE: "MALFORMED_RESPONSE",
  CANCELLED: "CANCELLED",
  UNKNOWN: "UNKNOWN",
};

// Only transient conditions are worth retrying. A validation failure, a 401 or
// a 404 will produce the same result no matter how many times we ask.
const RETRYABLE = new Set([
  ErrorKind.RATE_LIMITED,
  ErrorKind.SERVER,
  ErrorKind.NETWORK,
  ErrorKind.TIMEOUT,
  ErrorKind.MALFORMED_RESPONSE,
]);

// User-facing copy. Deliberately free of server text, stack traces, URLs, ids.
const USER_MESSAGE = {
  [ErrorKind.VALIDATION]: "Enter a valid business ID (3-32 letters, numbers, or -).",
  [ErrorKind.AUTH]: "You don't have permission to run this lookup.",
  [ErrorKind.NOT_FOUND]: "No trust record found for that business ID.",
  [ErrorKind.RATE_LIMITED]: "Too many lookups right now. Please wait a moment and try again.",
  [ErrorKind.SERVER]: "The trust service is having trouble. Please try again.",
  [ErrorKind.NETWORK]: "Can't reach the trust service. Check your connection and try again.",
  [ErrorKind.TIMEOUT]: "The lookup took too long. Please try again.",
  [ErrorKind.MALFORMED_RESPONSE]: "The trust service returned an unreadable response. Please try again.",
  [ErrorKind.CANCELLED]: "Lookup cancelled.",
  [ErrorKind.UNKNOWN]: "Something went wrong. Please try again.",
};

function makeCorrelationId() {
  const bytes = new Uint8Array(3);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `TL-${hex}`;
}

/**
 * A normalized client error.
 *
 * `message` stays safe for display; `detail` holds the internal cause and is
 * never rendered — it exists for console/telemetry only.
 */
export class TrustLookupError extends Error {
  constructor(kind, { detail = "", retryAfterMs = null, cause = undefined } = {}) {
    const safeKind = USER_MESSAGE[kind] ? kind : ErrorKind.UNKNOWN;
    super(USER_MESSAGE[safeKind]);
    this.name = "TrustLookupError";
    this.kind = safeKind;
    this.retryable = RETRYABLE.has(safeKind);
    this.retryAfterMs = retryAfterMs;
    this.correlationId = makeCorrelationId();
    // Internal only — never rendered.
    this.detail = detail;
    if (cause !== undefined) this.cause = cause;
  }

  /** Safe message for the UI. */
  get userMessage() {
    return this.message;
  }
}

export function validationError(detail = "") {
  return new TrustLookupError(ErrorKind.VALIDATION, { detail });
}

/** Map an HTTP status to a typed error (for when the real backend lands). */
export function fromHttpStatus(status, { detail = "", retryAfterMs = null } = {}) {
  if (status === 400 || status === 422) return new TrustLookupError(ErrorKind.VALIDATION, { detail });
  if (status === 401 || status === 403) return new TrustLookupError(ErrorKind.AUTH, { detail });
  if (status === 404) return new TrustLookupError(ErrorKind.NOT_FOUND, { detail });
  if (status === 408) return new TrustLookupError(ErrorKind.TIMEOUT, { detail });
  if (status === 429) return new TrustLookupError(ErrorKind.RATE_LIMITED, { detail, retryAfterMs });
  if (status >= 500) return new TrustLookupError(ErrorKind.SERVER, { detail });
  return new TrustLookupError(ErrorKind.UNKNOWN, { detail });
}

/**
 * Normalize anything thrown in the lookup path into a TrustLookupError.
 * Raw messages become `detail`, never user-facing copy.
 */
export function toClientError(err) {
  if (err instanceof TrustLookupError) return err;

  const name = err?.name ?? "";
  const raw = typeof err?.message === "string" ? err.message : String(err ?? "");

  if (name === "AbortError") {
    return new TrustLookupError(ErrorKind.CANCELLED, { detail: raw, cause: err });
  }
  if (name === "TimeoutError" || /timed?\s?out/i.test(raw)) {
    return new TrustLookupError(ErrorKind.TIMEOUT, { detail: raw, cause: err });
  }
  if (err instanceof SyntaxError || /json/i.test(raw)) {
    return new TrustLookupError(ErrorKind.MALFORMED_RESPONSE, { detail: raw, cause: err });
  }
  if (name === "TypeError" || /network|fetch failed|load failed/i.test(raw)) {
    return new TrustLookupError(ErrorKind.NETWORK, { detail: raw, cause: err });
  }
  return new TrustLookupError(ErrorKind.UNKNOWN, { detail: raw, cause: err });
}
