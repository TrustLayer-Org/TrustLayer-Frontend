"use client";

export default function VerifyForm() {
  return (
    <form className="space-y-4">
      <div>
        <label
          htmlFor="businessId"
          className="block text-sm font-medium text-zinc-300"
        >
          Business ID
        </label>
        <input
          id="businessId"
          name="businessId"
          type="text"
          placeholder="e.g. ACME-123"
          className="mt-1 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
      >
        Verify
      </button>
    </form>
  );
}
