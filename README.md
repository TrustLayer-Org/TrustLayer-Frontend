# TrustLayer Frontend

Next.js dashboard for TrustLayer: decentralized business trust scoring on Stellar. Starter UI with Tailwind; ready for Stellar wallet integration.

## What's in this repo

- **Next.js 16** – App Router, Tailwind CSS, ESLint
- **Starter page** – TrustLayer-themed home with placeholder sections
- **Business Trust Lookup** – `/verify` page to look up a business trust score
- **Recent Lookups** – localStorage-backed history of past lookups on `/verify`
- **Next Tier Hint & Result Sharing** – progress guidance and a copy-to-clipboard share button on the result card
- **Backend Configuration Safety** – validated environment config, URL injection prevention, environment diagnostics
- **CI** – Lint, tests, and build on push/PR to `main`

## Prerequisites

- Node.js 20+ and npm

## Setup

```bash
# Clone (or you're already in the repo)
git clone <your-remote>/trustlayer-frontend
cd trustlayer-frontend

# Install dependencies
npm ci

# Configure environment (required)
cp .env.example .env.local
# Edit .env.local with your backend URL and environment

# Lint
npm run lint

# Test
npm test

# Build
npm run build

# Dev server (http://localhost:3000)
npm run dev
```

## Environment Configuration

The app requires two environment variables:

| Variable                  | Description                              | Example                        |
|---------------------------|------------------------------------------|--------------------------------|
| `NEXT_PUBLIC_BACKEND_URL` | Backend API base URL (http or https)     | `https://api.trustlayer.io`    |
| `NEXT_PUBLIC_APP_ENV`     | Environment: `development`, `test`, or `production` | `production`       |

**Safety checks:**
- Missing or malformed values fail the build with an actionable error message.
- Production environments must not use localhost, 127.0.0.1, .test, .local, or other dev-looking URLs.
- URLs with embedded credentials, hash fragments, or injection characters are rejected.
- Non-production environments using production-looking URLs trigger a warning.

See `.env.example` for all configuration options.

## Scripts

| Script        | Description                                      |
|---------------|--------------------------------------------------|
| `dev`         | Start dev server                                 |
| `build`       | Production build (validates config)              |
| `start`       | Start production server                          |
| `lint`        | Run ESLint on `src`                              |
| `test`        | Run lint and config tests                        |
| `test:config` | Run config validation tests only                 |
| `smoke`       | Smoke test a production build                    |

## Business Trust Lookup

The `/verify` route lets you look up the trust score for a business by id.
It is built from small, reusable pieces:

- `src/lib/trust.js` – pure scoring helpers (labels, colors, tiers, grades)
- `src/lib/lookup.js` – backend-aware lookup with mock fallback for development
- `src/lib/config.js` – environment configuration validation and safe URL construction
- `src/components/TrustBadge.js` – colored trust-tier badge
- `src/components/ScoreMeter.js` – score progress meter
- `src/components/ScoreCard.js` – result card combining the above
- `src/components/ScoreLegend.js` – tier reference legend
- `src/components/VerifyForm.js` – client form driving the lookup

## Recent Lookups

The `/verify` form keeps a small localStorage-backed history of past lookups,
capped at the 5 most recent, deduped by business id:

- `src/lib/history.js` – pure helpers for reading, writing, and updating the stored history
- `src/lib/useLookupHistory.js` – hook wiring the helpers into component state
- `src/components/RecentLookups.js` – renders the history list; entries are clickable to re-run a lookup

## Next Tier Hint & Result Sharing

The result card on `/verify` also shows how far a score is from the next
trust tier, and offers a way to copy the result:

- `src/lib/trust.js` – `nextTierLabel` / `isTopTier` for tier progress, `buildShareSummary` for a copyable summary
- `src/components/NextTierHint.js` – shows points remaining to the next tier, or a top-tier message
- `src/components/ShareResultButton.js` – copies the result summary to the clipboard, with a confirmation and a fallback for older browsers

## Contributing

1. Fork the repo and create a branch from `main`.
2. Run `npm run lint` and `npm run build` before pushing.
3. Open a pull request to `main`. CI will run lint, tests, and build.

## License

MIT
