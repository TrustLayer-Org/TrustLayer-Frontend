export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <main className="max-w-4xl mx-auto px-6 py-16">
        <header className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight">
            TrustLayer
          </h1>
          <p className="text-zinc-400 mt-2">
            Decentralized business trust scoring on Stellar
          </p>
        </header>
        <section className="space-y-6">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-semibold mb-2">Trust Score</h2>
            <p className="text-zinc-400 text-sm">
              Verify business credibility using on-chain trust signals.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="text-lg font-semibold mb-2">Get started</h2>
            <p className="text-zinc-400 text-sm">
              Connect a Stellar wallet to view your trust profile or verify a
              partner.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
