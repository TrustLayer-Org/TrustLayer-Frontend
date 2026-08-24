import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "TrustLayer",
  description:
    "Decentralized business trust scoring on Stellar — verify business credibility using on-chain trust signals.",
};

// Environment identity is exposed via build-time constants set in
// next.config.mjs. These are safe to render (no secrets, no full URLs).
const appEnv = process.env.TRUSTLAYER_ENV ?? "development";
const backendHost = process.env.TRUSTLAYER_BACKEND_HOST ?? "unconfigured";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* Diagnostic banner: environment and backend identity, visible in
            non-production builds to help developers verify configuration. */}
        {appEnv !== "production" ? (
          <div
            role="status"
            aria-label="Environment diagnostic"
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-900/95 px-4 py-1.5 text-center text-xs text-zinc-500 backdrop-blur"
          >
            env: <span className="font-mono text-zinc-400">{appEnv}</span>
            {" · "}
            backend:{" "}
            <span className="font-mono text-zinc-400">{backendHost}</span>
          </div>
        ) : null}
      </body>
    </html>
  );
}
