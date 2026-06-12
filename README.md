# TrustLayer Frontend

Next.js dashboard for TrustLayer: decentralized business trust scoring on Stellar. Starter UI with Tailwind; ready for Stellar wallet integration.

## What’s in this repo

- **Next.js 16** – App Router, Tailwind CSS, ESLint
- **Starter page** – TrustLayer-themed home with placeholder sections
- **Business Trust Lookup** – `/verify` page to look up a business trust score
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

## Contributing

1. Fork the repo and create a branch from `main`.
2. Run `npm run lint` and `npm run build` before pushing.
3. Open a pull request to `main`. CI will run lint and build.

## License

MIT
