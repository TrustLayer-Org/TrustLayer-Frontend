import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  validateConfig,
  buildRequestUrl,
  getConfigDiagnostics,
} from "../lib/config.js";

// Save and restore env between tests so they don't leak.
const ORIGINAL_ENV = { ...process.env };

function setEnv(overrides) {
  process.env = { ...ORIGINAL_ENV, ...overrides };
}

function restoreEnv() {
  process.env = { ...ORIGINAL_ENV };
}

// ---------------------------------------------------------------------------
// validateConfig
// ---------------------------------------------------------------------------
describe("validateConfig", () => {
  afterEach(restoreEnv);

  it("throws when NEXT_PUBLIC_BACKEND_URL is missing", () => {
    setEnv({ NEXT_PUBLIC_APP_ENV: "development" });
    assert.throws(() => validateConfig(), /NEXT_PUBLIC_BACKEND_URL/);
  });

  it("throws when NEXT_PUBLIC_BACKEND_URL is empty", () => {
    setEnv({
      NEXT_PUBLIC_BACKEND_URL: "   ",
      NEXT_PUBLIC_APP_ENV: "development",
    });
    assert.throws(() => validateConfig(), /Backend URL/);
  });

  it("throws when NEXT_PUBLIC_BACKEND_URL is not a valid URL", () => {
    setEnv({
      NEXT_PUBLIC_BACKEND_URL: "not-a-url",
      NEXT_PUBLIC_APP_ENV: "development",
    });
    assert.throws(() => validateConfig(), /not a valid URL/);
  });

  it("throws when NEXT_PUBLIC_BACKEND_URL uses ftp protocol", () => {
    setEnv({
      NEXT_PUBLIC_BACKEND_URL: "ftp://example.com",
      NEXT_PUBLIC_APP_ENV: "development",
    });
    assert.throws(() => validateConfig(), /http or https/);
  });

  it("throws when NEXT_PUBLIC_BACKEND_URL contains embedded credentials", () => {
    setEnv({
      NEXT_PUBLIC_BACKEND_URL: "https://user:pass@example.com",
      NEXT_PUBLIC_APP_ENV: "development",
    });
    assert.throws(() => validateConfig(), /embedded credentials/);
  });

  it("throws when NEXT_PUBLIC_BACKEND_URL contains a hash fragment", () => {
    setEnv({
      NEXT_PUBLIC_BACKEND_URL: "https://example.com#fragment",
      NEXT_PUBLIC_APP_ENV: "development",
    });
    assert.throws(() => validateConfig(), /hash fragment/);
  });

  it("throws when NEXT_PUBLIC_APP_ENV is missing", () => {
    setEnv({ NEXT_PUBLIC_BACKEND_URL: "https://api.example.com" });
    assert.throws(() => validateConfig(), /NEXT_PUBLIC_APP_ENV/);
  });

  it("throws when NEXT_PUBLIC_APP_ENV is invalid", () => {
    setEnv({
      NEXT_PUBLIC_BACKEND_URL: "https://api.example.com",
      NEXT_PUBLIC_APP_ENV: "staging",
    });
    assert.throws(() => validateConfig(), /Invalid APP_ENV/);
  });

  it("throws when production env uses a test/dev URL (localhost)", () => {
    setEnv({
      NEXT_PUBLIC_BACKEND_URL: "http://localhost:3001",
      NEXT_PUBLIC_APP_ENV: "production",
    });
    assert.throws(() => validateConfig(), /must not use a test\/dev URL/);
  });

  it("throws when production env uses a 127.0.0.1 URL", () => {
    setEnv({
      NEXT_PUBLIC_BACKEND_URL: "http://127.0.0.1:8080",
      NEXT_PUBLIC_APP_ENV: "production",
    });
    assert.throws(() => validateConfig(), /must not use a test\/dev URL/);
  });

  it("throws when production env uses a .test domain", () => {
    setEnv({
      NEXT_PUBLIC_BACKEND_URL: "https://api.test",
      NEXT_PUBLIC_APP_ENV: "production",
    });
    assert.throws(() => validateConfig(), /must not use a test\/dev URL/);
  });

  it("succeeds with valid production config", () => {
    setEnv({
      NEXT_PUBLIC_BACKEND_URL: "https://api.trustlayer.io",
      NEXT_PUBLIC_APP_ENV: "production",
    });
    const result = validateConfig();
    assert.equal(result.backendUrl, "https://api.trustlayer.io");
    assert.equal(result.appEnv, "production");
    assert.equal(result.isTestEnv, false);
  });

  it("succeeds with valid development config", () => {
    setEnv({
      NEXT_PUBLIC_BACKEND_URL: "http://localhost:3001",
      NEXT_PUBLIC_APP_ENV: "development",
    });
    const result = validateConfig();
    assert.equal(result.backendUrl, "http://localhost:3001");
    assert.equal(result.appEnv, "development");
    assert.equal(result.isTestEnv, true);
  });

  it("succeeds with valid test config", () => {
    setEnv({
      NEXT_PUBLIC_BACKEND_URL: "http://localhost:4000",
      NEXT_PUBLIC_APP_ENV: "test",
    });
    const result = validateConfig();
    assert.equal(result.appEnv, "test");
    assert.equal(result.isTestEnv, true);
  });

  it("trims whitespace from config values", () => {
    setEnv({
      NEXT_PUBLIC_BACKEND_URL: "  https://api.trustlayer.io  ",
      NEXT_PUBLIC_APP_ENV: "  production  ",
    });
    const result = validateConfig();
    assert.equal(result.backendUrl, "https://api.trustlayer.io");
    assert.equal(result.appEnv, "production");
  });
});

// ---------------------------------------------------------------------------
// URL injection patterns
// ---------------------------------------------------------------------------
describe("URL injection prevention", () => {
  afterEach(restoreEnv);

  const injectionPayloads = [
    "https://evil.com\0.example.com",
    "https://example.com/../../etc/passwd",
    "https://example.com/<script>",
    "https://example.com/{inject}",
    "https://example.com/|pipe",
    "https://example.com/^caret",
    "https://example.com/`backtick",
  ];

  for (const payload of injectionPayloads) {
    it(`rejects injection payload: ${JSON.stringify(payload)}`, () => {
      setEnv({
        NEXT_PUBLIC_BACKEND_URL: payload,
        NEXT_PUBLIC_APP_ENV: "development",
      });
      assert.throws(() => validateConfig());
    });
  }
});

// ---------------------------------------------------------------------------
// buildRequestUrl
// ---------------------------------------------------------------------------
describe("buildRequestUrl", () => {
  afterEach(restoreEnv);

  beforeEach(() => {
    setEnv({
      NEXT_PUBLIC_BACKEND_URL: "https://api.trustlayer.io",
      NEXT_PUBLIC_APP_ENV: "production",
    });
  });

  it("constructs a URL from base and path", () => {
    const url = buildRequestUrl("/api/v1/businesses/ACME/score");
    assert.equal(url, "https://api.trustlayer.io/api/v1/businesses/ACME/score");
  });

  it("normalizes paths without leading slash", () => {
    const url = buildRequestUrl("api/v1/businesses/ACME/score");
    assert.equal(url, "https://api.trustlayer.io/api/v1/businesses/ACME/score");
  });

  it("strips trailing slashes from base and path", () => {
    setEnv({
      NEXT_PUBLIC_BACKEND_URL: "https://api.trustlayer.io/",
      NEXT_PUBLIC_APP_ENV: "production",
    });
    const url = buildRequestUrl("/api/v1/score/");
    assert.equal(url, "https://api.trustlayer.io/api/v1/score");
  });

  it("rejects empty path", () => {
    assert.throws(() => buildRequestUrl(""), /required/);
  });

  it("rejects null path", () => {
    assert.throws(() => buildRequestUrl(null), /required/);
  });

  it("rejects path with path traversal", () => {
    assert.throws(
      () => buildRequestUrl("/api/../../../etc/passwd"),
      /unsafe characters/
    );
  });

  it("rejects path with HTML injection", () => {
    assert.throws(
      () => buildRequestUrl("/api/<script>alert(1)</script>"),
      /unsafe characters/
    );
  });

  it("rejects path with shell injection characters", () => {
    assert.throws(
      () => buildRequestUrl("/api/`whoami`"),
      /unsafe characters/
    );
  });
});

// ---------------------------------------------------------------------------
// getConfigDiagnostics
// ---------------------------------------------------------------------------
describe("getConfigDiagnostics", () => {
  afterEach(restoreEnv);

  it("returns environment and backend host without exposing full URL", () => {
    setEnv({
      NEXT_PUBLIC_BACKEND_URL: "https://api.trustlayer.io/v1",
      NEXT_PUBLIC_APP_ENV: "production",
    });
    const diag = getConfigDiagnostics();
    assert.equal(diag.environment, "production");
    assert.equal(diag.backendHost, "api.trustlayer.io");
    assert.equal(diag.isTestEnv, false);
  });

  it("identifies test environments", () => {
    setEnv({
      NEXT_PUBLIC_BACKEND_URL: "http://localhost:3001",
      NEXT_PUBLIC_APP_ENV: "development",
    });
    const diag = getConfigDiagnostics();
    assert.equal(diag.environment, "development");
    assert.equal(diag.backendHost, "localhost:3001");
    assert.equal(diag.isTestEnv, true);
  });
});
