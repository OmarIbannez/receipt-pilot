"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

interface DownloadPanelProps {
  selectedIds: Set<string>;
}

export default function DownloadPanel({ selectedIds }: DownloadPanelProps) {
  const [loading, setLoading] = useState(false);

  if (selectedIds.size === 0) return null;

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch("/api/download/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenseIds: Array.from(selectedIds) }),
      });

      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "receipts.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // error is silently handled; user sees loading state reset
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <span className="text-sm font-medium text-amber-900">
        {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected
      </span>
      <Button variant="primary" size="sm" loading={loading} onClick={handleDownload}>
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
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Download {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} as ZIP
      </Button>
    </div>
  );
}
