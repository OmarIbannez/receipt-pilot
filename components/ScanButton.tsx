"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

interface ScanButtonProps {
  onScanComplete: () => void;
}

export default function ScanButton({ onScanComplete }: ScanButtonProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [daysBack, setDaysBack] = useState(30);

  async function handleScan() {
    setLoading(true);
    setProgress("Connecting to Gmail...");

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daysBack }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Scan failed");
      }

      const data = await res.json();
      setProgress(`Found ${data.count} expenses`);
      onScanComplete();
    } catch (err) {
      setProgress(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={daysBack}
        onChange={(e) => setDaysBack(Number(e.target.value))}
        disabled={loading}
        className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-500"
      >
        <option value={7}>Last 7 days</option>
        <option value={30}>Last 30 days</option>
        <option value={90}>Last 90 days</option>
        <option value={180}>Last 6 months</option>
      </select>

      <Button onClick={handleScan} loading={loading}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
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
        Scan Gmail
      </Button>

      {progress && (
        <span className="text-sm text-stone-500">{progress}</span>
      )}
    </div>
  );
}
