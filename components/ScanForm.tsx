"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

export type EmailResult = {
  messageId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  hasAttachments: boolean;
  attachments: {
    filename: string;
    mimeType: string;
    attachmentId: string;
    size: number;
  }[];
};

interface ScanFormProps {
  onResults: (results: EmailResult[]) => void;
}

const daysOptions = [7, 30, 90, 365] as const;

export default function ScanForm({ onResults }: ScanFormProps) {
  const [daysBack, setDaysBack] = useState<number>(30);
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState("");

  const handleScan = async () => {
    setLoading(true);
    setScanStatus("Scanning emails...");
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daysBack }),
      });
      if (!res.ok) {
        throw new Error("Scan failed");
      }
      const data = await res.json();
      setScanStatus(`Found ${data.results?.length ?? 0} emails`);
      onResults(data.results ?? []);
    } catch {
      setScanStatus("Scan failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-900">Scan Gmail</h2>
      <p className="mt-1 text-sm text-stone-500">
        Choose how far back to search for receipt emails.
      </p>

      {/* Days-back selector */}
      <div className="mt-4 flex flex-wrap gap-2">
        {daysOptions.map((d) => (
          <button
            key={d}
            onClick={() => setDaysBack(d)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              daysBack === d
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            {d} days
          </button>
        ))}
      </div>

      {/* Scan button */}
      <div className="mt-5 flex items-center gap-4">
        <Button size="lg" onClick={handleScan} loading={loading}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          {loading ? "Scanning..." : "Scan Gmail"}
        </Button>
        {scanStatus && (
          <span className="text-sm text-stone-500">{scanStatus}</span>
        )}
      </div>
    </div>
  );
}
