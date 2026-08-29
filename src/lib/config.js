// Runtime configuration for TrustLayer backend connectivity.
// Validates environment variables at import time so misconfiguration fails fast.

// Allowed application environments. "test" and "production" must use distinct
// backend URLs to prevent silent endpoint mixing.
const ALLOWED_ENVS = ["development", "test", "production"];

// Required environment variables and their validation rules.
const REQUIRED_VARS = {
  NEXT_PUBLIC_BACKEND_URL: {
    description: "Backend API base URL",
    validate: validateBackendUrl,
  },
  NEXT_PUBLIC_APP_ENV: {
    description: "Application environment",
    validate: validateAppEnv,
  },
};

// Well-known test/dev URL patterns that must not be used in production.
const TEST_URL_PATTERNS = [
  /localhost/i,
  /127\.0\.0\.\d+/,
  /0\.0\.0\.0/,
  /\.local$/i,
  /\.test$/i,
  /\.example$/i,
  /:\d{4,5}$/, // non-standard ports often indicate dev servers
];

// Characters that indicate potential URL/path injection.
const INJECTION_PATTERNS = [
  /\.\./, // path traversal
  /[<>"{}|\\^`]/, // shell/HTML injection characters
  /[\x00-\x1f]/, // control characters
  /%0[0-9a-f]/i, // encoded control characters
  /%2[fF]/i, // encoded slash (path traversal)
  /%5[cC]/i, // encoded backslash
];

/**
 * Validate that a URL is well-formed and safe for backend requests.
 * @param {string} url raw URL value
 * @returns {{ valid: boolean, error?: string }}
 */
function validateBackendUrl(url) {
  if (!url || typeof url !== "string") {
    return { valid: false, error: "Backend URL is required." };
  }

  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "Backend URL cannot be empty." };
  }

  // Check for injection patterns before parsing.
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        valid: false,
        error: `Backend URL contains unsafe characters: ${trimmed}`,
      };
    }
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: `Backend URL is not a valid URL: ${trimmed}` };
  }

  // Only allow http/https protocols.
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return {
      valid: false,
      error: `Backend URL must use http or https protocol: ${parsed.protocol}`,
    };
  }

  // Reject URLs with credentials embedded.
  if (parsed.username || parsed.password) {
    return {
      valid: false,
      error: "Backend URL must not contain embedded credentials.",
    };
  }

  // Reject URLs with fragments (could be used for injection).
  if (parsed.hash) {
    return {
      valid: false,
      error: "Backend URL must not contain a hash fragment.",
    };
  }

  return { valid: true };
}

/**
 * Validate the application environment value.
 * @param {string} env raw environment value
 * @returns {{ valid: boolean, error?: string }}
 */
function validateAppEnv(env) {
  if (!env || typeof env !== "string") {
    return { valid: false, error: "App environment is required." };
  }

  const trimmed = env.trim().toLowerCase();
  if (!ALLOWED_ENVS.includes(trimmed)) {
    return {
      valid: false,
      error: `Invalid APP_ENV "${env}". Allowed: ${ALLOWED_ENVS.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Check whether a URL looks like a test/dev endpoint.
 * @param {string} url the backend URL
 * @returns {boolean}
 */
function isTestUrl(url) {
  return TEST_URL_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Validate all required configuration. Throws with an actionable message
 * on the first validation failure.
 * @returns {{ backendUrl: string, appEnv: string, isTestEnv: boolean }}
 */
export function validateConfig() {
  const errors = [];

  for (const [name, rule] of Object.entries(REQUIRED_VARS)) {
    const value = process.env[name];
    const result = rule.validate(value);
    if (!result.valid) {
      errors.push(`[${name}] ${result.error}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `TrustLayer configuration error:\n${errors.join("\n")}\n` +
        "Set the required environment variables and restart."
    );
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL.trim();
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV.trim().toLowerCase();
  const testUrl = isTestUrl(backendUrl);

  // Prevent test/production endpoint mixing.
  if (appEnv === "production" && testUrl) {
    throw new Error(
      "TrustLayer configuration error:\n" +
        `[NEXT_PUBLIC_BACKEND_URL] Production environment must not use a test/dev URL: ${backendUrl}\n` +
        "Set a production backend URL or switch NEXT_PUBLIC_APP_ENV to 'test' or 'development'."
    );
  }

  if (appEnv !== "production" && !testUrl) {
    // Warn but don't block — non-production envs may legitimately use prod URLs
    // for staging or integration testing.
    console.warn(
      `[TrustLayer Config] Non-production environment "${appEnv}" is using a production-looking backend URL. ` +
        "This is allowed but may indicate a misconfiguration."
    );
  }

  return {
    backendUrl,
    appEnv,
    isTestEnv: testUrl,
  };
}

/**
 * Build a safe request URL from the validated backend base and a path.
 * Prevents path injection by validating the path segment.
 * @param {string} path the API path (e.g. "/api/v1/businesses/ACME/score")
 * @returns {string} the full URL
 */
export function buildRequestUrl(path) {
  if (!path || typeof path !== "string") {
    throw new Error("Request path is required.");
  }

  // Reject path injection attempts.
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(path)) {
      throw new Error(`Request path contains unsafe characters: ${path}`);
    }
  }

  // Normalize: ensure path starts with /, strip trailing slash.
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const cleanPath = normalizedPath.replace(/\/+$/, "");

  const { backendUrl } = validateConfig();
  const base = backendUrl.replace(/\/+$/, "");

  return `${base}${cleanPath}`;
}

/**
 * Return diagnostic info about the current configuration, safe for
 * client-side display (no secrets).
 * @returns {{ environment: string, backendHost: string, isTestEnv: boolean }}
 */
export function getConfigDiagnostics() {
  const { backendUrl, appEnv, isTestEnv } = validateConfig();

  // Extract just the hostname for diagnostics — never expose the full URL
  // which could contain path segments or query parameters.
  let backendHost;
  try {
    backendHost = new URL(backendUrl).host;
  } catch {
    backendHost = "invalid";
  }

  return {
    environment: appEnv,
    backendHost,
    isTestEnv,
  };
}
