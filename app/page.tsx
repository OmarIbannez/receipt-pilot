"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import LandingHero from "@/components/LandingHero";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-300 border-t-stone-900" />
      </div>
    );
  }

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <LandingHero />

        {/* How it works */}
        <section className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-center text-2xl font-semibold text-stone-900">
            How it works
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Sign in with Google",
                desc: "We request read-only access to your Gmail. We never modify or delete anything.",
              },
              {
                step: "2",
                title: "Scan for expenses",
                desc: "Our AI searches your inbox for invoices, receipts, subscriptions, and bills.",
              },
              {
                step: "3",
                title: "Download everything",
                desc: "Get real PDF attachments organized by category. Bulk export as a ZIP file.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 text-sm font-bold text-white">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-stone-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-stone-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center text-2xl font-semibold text-stone-900">
              Simple pricing
            </h2>
            <p className="mt-2 text-center text-stone-600">
              Start free. Upgrade when you need more.
            </p>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                {
                  name: "Free",
                  price: "$0",
                  period: "forever",
                  features: [
                    "1 scan per month",
                    "Last 30 days of emails",
                    "Single file downloads",
                    "AI categorization",
                  ],
                  cta: "Get started",
                  highlight: false,
                },
                {
                  name: "Pro",
                  price: "$7",
                  period: "/month",
                  features: [
                    "Unlimited scans",
                    "1 year of email history",
                    "Bulk ZIP download",
                    "Email-to-PDF export",
                    "Priority support",
                  ],
                  cta: "Start Pro trial",
                  highlight: true,
                },
                {
                  name: "Business",
                  price: "$19",
                  period: "/month",
                  features: [
                    "Everything in Pro",
                    "Team sharing",
                    "API access",
                    "QuickBooks export",
                    "Dedicated support",
                  ],
                  cta: "Contact us",
                  highlight: false,
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-xl border p-6 ${
                    plan.highlight
                      ? "border-stone-900 bg-stone-50 shadow-lg ring-1 ring-stone-900"
                      : "border-stone-200 bg-white shadow-sm"
                  }`}
                >
                  <h3 className="text-lg font-semibold text-stone-900">
                    {plan.name}
                  </h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-stone-900">
                      {plan.price}
                    </span>
                    <span className="text-stone-500">{plan.period}</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-sm text-stone-700"
                      >
                        <svg
                          className="h-4 w-4 text-emerald-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`mt-8 w-full rounded-lg py-2.5 text-sm font-medium transition-colors ${
                      plan.highlight
                        ? "bg-stone-900 text-white hover:bg-stone-800"
                        : "border border-stone-300 bg-white text-stone-900 hover:bg-stone-50"
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust signals */}
        <section className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold text-stone-900">
            Your privacy matters
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Read-only access",
                desc: "We never modify, send, or delete your emails.",
              },
              {
                title: "No email storage",
                desc: "We extract metadata only. Full emails are never stored.",
              },
              {
                title: "Delete anytime",
                desc: "One click removes all your data from our servers.",
              },
            ].map((t) => (
              <div key={t.title}>
                <h3 className="font-semibold text-stone-900">{t.title}</h3>
                <p className="mt-1 text-sm text-stone-600">{t.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-stone-200 bg-white py-8">
          <div className="mx-auto max-w-5xl px-6 text-center text-sm text-stone-500">
            &copy; {new Date().getFullYear()} ReceiptPilot. All rights
            reserved.
          </div>
        </footer>
      </main>
    </div>
  );
}
