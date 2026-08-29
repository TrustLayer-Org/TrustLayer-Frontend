import { validateConfig } from "./src/lib/config.js";

// Validate backend configuration at build/startup time. This ensures
// missing or malformed values fail with an actionable signal rather than
// causing silent runtime failures.
let config;
try {
  config = validateConfig();
} catch (err) {
  // In CI/build, fail hard. In dev, warn so the developer can fix it.
  if (process.env.NODE_ENV === "production" || process.env.CI) {
    console.error(err.message);
    process.exit(1);
  } else {
    console.warn(err.message);
    console.warn(
      "[TrustLayer] Continuing in development mode without validated config."
    );
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Expose validated config as build-time constants so they are inlined
  // and available without runtime re-validation overhead.
  env: {
    TRUSTLAYER_ENV: config?.appEnv ?? "development",
    TRUSTLAYER_BACKEND_HOST: config
      ? (() => {
          try {
            return new URL(config.backendUrl).host;
          } catch {
            return "unconfigured";
          }
        })()
      : "unconfigured",
  },
};

export default nextConfig;
