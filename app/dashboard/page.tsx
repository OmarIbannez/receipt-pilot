"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import ScanForm from "@/components/ScanForm";
import type { EmailResult } from "@/components/ScanForm";
import ResultsList from "@/components/ResultsList";

export default function DashboardPage() {
  const { status } = useSession();
  const [results, setResults] = useState<EmailResult[]>([]);

  if (status === "unauthenticated") {
    redirect("/");
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-300 border-t-stone-900" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
          <p className="text-sm text-stone-500">
            Find and download receipt emails from your Gmail.
          </p>
        </div>

        {/* Scan form */}
        <ScanForm onResults={setResults} />

        {/* Results */}
        <div className="mt-8">
          {results.length > 0 ? (
            <ResultsList results={results} />
          ) : (
            <div className="rounded-xl border border-stone-200 bg-white py-20 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                <svg
                  className="h-8 w-8 text-stone-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-stone-900">
                Scan your Gmail to find receipts
              </h3>
              <p className="mt-1 text-sm text-stone-500">
                Choose how far back to look and hit Scan Gmail above.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
