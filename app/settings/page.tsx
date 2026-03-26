"use client";

import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState } from "react";
import Navbar from "@/components/Navbar";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  if (status === "unauthenticated") {
    redirect("/");
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-300 border-t-stone-900" />
      </div>
    );
  }

  const handleDeleteData = async () => {
    if (
      !confirm(
        "Are you sure you want to delete all your data? This cannot be undone."
      )
    )
      return;
    setDeleting(true);
    try {
      const res = await fetch("/api/expenses", { method: "DELETE" });
      if (res.ok) {
        setDeleted(true);
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleManageBilling = async () => {
    const res = await fetch("/api/billing/portal", { method: "POST" });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <h1 className="text-2xl font-bold text-stone-900">Settings</h1>

        {/* Account */}
        <section className="mt-8 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900">Account</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-600">Email</span>
              <span className="text-sm font-medium text-stone-900">
                {session?.user?.email}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-600">Name</span>
              <span className="text-sm font-medium text-stone-900">
                {session?.user?.name}
              </span>
            </div>
          </div>
        </section>

        {/* Plan */}
        <section className="mt-6 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900">Plan</h2>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-medium text-stone-700">
                Free
              </span>
              <p className="mt-2 text-sm text-stone-500">
                1 scan per month, 30-day history
              </p>
            </div>
            <button
              onClick={handleManageBilling}
              className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800"
            >
              Upgrade to Pro
            </button>
          </div>
        </section>

        {/* Privacy */}
        <section className="mt-6 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900">
            Privacy & Data
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            We only store expense metadata (subject, amount, category). Full
            email bodies are not retained. Attachments are downloaded on-demand
            from Gmail.
          </p>
          <div className="mt-4 border-t border-stone-100 pt-4">
            {deleted ? (
              <p className="text-sm text-emerald-600">
                All your data has been deleted.
              </p>
            ) : (
              <button
                onClick={handleDeleteData}
                disabled={deleting}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete all my data"}
              </button>
            )}
          </div>
        </section>

        {/* Sign out */}
        <section className="mt-6 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
          >
            Sign out
          </button>
        </section>
      </main>
    </div>
  );
}
