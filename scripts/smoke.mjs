// Smoke test: validate that the production build starts and serves correctly.
// Run after `npm run build` with the target environment configured.
//
// Usage:
//   NEXT_PUBLIC_BACKEND_URL=https://api.trustlayer.io NEXT_PUBLIC_APP_ENV=production npm run smoke

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";

const PORT = parseInt(process.env.SMOKE_PORT || "3099", 10);
const TIMEOUT_MS = 15_000;

async function main() {
  console.log("[smoke] Starting production server on port %d …", PORT);

  const child = spawn("npx", ["next", "start", "-p", String(PORT)], {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PORT: String(PORT) },
  });

  let output = "";
  child.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });

  // Wait for the server to be ready or fail.
  const deadline = Date.now() + TIMEOUT_MS;
  let ready = false;

  while (Date.now() < deadline) {
    if (output.includes("Ready") || output.includes("started server")) {
      ready = true;
      break;
    }
    if (child.exitCode !== null) {
      break;
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  if (!ready) {
    child.kill();
    console.error("[smoke] FAIL: Server did not start within %dms", TIMEOUT_MS);
    console.error("[smoke] Output:\n%s", output);
    process.exit(1);
  }

  console.log("[smoke] Server started. Running checks …");

  let failures = 0;

  // Check 1: Home page loads.
  failures += await check("GET", `http://localhost:${PORT}/`, 200);

  // Check 2: Verify page loads.
  failures += await check("GET", `http://localhost:${PORT}/verify`, 200);

  // Check 3: Non-existent page returns 404.
  failures += await check("GET", `http://localhost:${PORT}/nonexistent`, 404);

  child.kill();

  if (failures > 0) {
    console.error("[smoke] FAIL: %d check(s) failed.", failures);
    process.exit(1);
  }

  console.log("[smoke] PASS: All checks passed.");
}

function check(method, url, expectedStatus) {
  return new Promise((resolve) => {
    const req = createServer(); // dummy — we use fetch
    fetch(url, { method })
      .then((res) => {
        if (res.status === expectedStatus) {
          console.log("[smoke] ✔ %s %s → %d", method, url, res.status);
          resolve(0);
        } else {
          console.error(
            "[smoke] ✘ %s %s → %d (expected %d)",
            method,
            url,
            res.status,
            expectedStatus
          );
          resolve(1);
        }
      })
      .catch((err) => {
        console.error("[smoke] ✘ %s %s → %s", method, url, err.message);
        resolve(1);
      });
  });
}

main().catch((err) => {
  console.error("[smoke] Unexpected error:", err);
  process.exit(1);
});
