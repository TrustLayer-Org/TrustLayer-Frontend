# TrustLayer Frontend

Next.js dashboard for TrustLayer: decentralized business trust scoring on Stellar. Starter UI with Tailwind; ready for Stellar wallet integration.

## What’s in this repo

- **Next.js 16** – App Router, Tailwind CSS, ESLint
- **Starter page** – TrustLayer-themed home with placeholder sections
- **Business Trust Lookup** – `/verify` page to look up a business trust score
- **Recent Lookups** – localStorage-backed history of past lookups on `/verify`
- **Next Tier Hint & Result Sharing** – progress guidance and a copy-to-clipboard share button on the result card
- **CI** – Lint and build on push/PR to `main`

## Prerequisites

- Node.js 20+ and npm

## Setup

```bash
# Clone (or you're already in the repo)
git clone <your-remote>/trustlayer-frontend
cd trustlayer-frontend

# Install dependencies
npm ci

# Lint
npm run lint

# Build
npm run build

# Dev server (http://localhost:3000)
npm run dev
```

## Scripts

| Script   | Description           |
|----------|-----------------------|
| `dev`    | Start dev server      |
| `build`  | Production build      |
| `start`  | Start production server |
| `lint`   | Run ESLint on `src`   |
| `test`   | Run lint (add unit tests as needed) |

## Business Trust Lookup

The `/verify` route lets you look up the trust score for a business by id.
It is built from small, reusable pieces:

- `src/lib/trust.js` – pure scoring helpers (labels, colors, tiers, grades)
- `src/lib/lookup.js` – mock async lookup (swap for the backend score endpoint)
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
3. Open a pull request to `main`. CI will run lint and build.

## License

MIT
