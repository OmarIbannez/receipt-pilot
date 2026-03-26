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
    <div className="flex min-h-screen flex-col bg-stone-50">
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
                title: "Scan for receipts",
                desc: "Search your inbox for invoices, receipts, subscriptions, and bills.",
              },
              {
                step: "3",
                title: "Download everything",
                desc: "Get .eml files, attachments, and email-as-HTML exports. Bulk download as ZIP.",
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

        {/* Features */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center text-2xl font-semibold text-stone-900">
              Everything you need
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-2">
              {[
                {
                  title: ".eml download",
                  desc: "Download the original email in standard .eml format, compatible with any email client.",
                },
                {
                  title: "Attachment download",
                  desc: "Grab PDF invoices, receipts, and any other attachments directly from the email.",
                },
                {
                  title: "Email-as-HTML",
                  desc: "Export the email body as an HTML file for easy viewing and archival.",
                },
                {
                  title: "Bulk ZIP export",
                  desc: "Select multiple emails and download them all at once in a single ZIP file.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="flex gap-4 rounded-xl border border-stone-200 bg-stone-50 p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <svg
                      className="h-5 w-5"
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
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-sm text-stone-600">
                      {feature.desc}
                    </p>
                  </div>
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
                title: "No storage",
                desc: "Nothing is saved. Your data stays in your Gmail.",
              },
              {
                title: "Fully stateless",
                desc: "No database, no accounts, no tracking. Just sign in and download.",
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
