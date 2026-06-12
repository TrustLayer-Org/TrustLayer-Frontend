import VerifyForm from "@/components/VerifyForm";

export const metadata = {
  title: "Verify a business | TrustLayer",
  description: "Look up the on-chain trust score for a registered business.",
};

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <main className="max-w-4xl mx-auto px-6 py-16">
        <header className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight">
            Verify a business
          </h1>
          <p className="text-zinc-400 mt-2">
            Look up the on-chain trust score for any registered business.
          </p>
        </header>
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
          <VerifyForm />
        </section>
      </main>
    </div>
  );
}
