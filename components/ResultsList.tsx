"use client";

import { useState } from "react";
import type { EmailResult } from "@/components/ScanForm";
import ResultRow from "@/components/ResultRow";
import Button from "@/components/ui/Button";

interface ResultsListProps {
  results: EmailResult[];
}

export default function ResultsList({ results }: ResultsListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDownloading, setBulkDownloading] = useState(false);

  const allSelected =
    results.length > 0 && selectedIds.size === results.length;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(results.map((r) => r.messageId)));
    }
  };

  const handleBulkDownload = async () => {
    setBulkDownloading(true);
    try {
      const res = await fetch("/api/download/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageIds: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error("Bulk download failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "receipts.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    } finally {
      setBulkDownloading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={handleSelectAll}
            className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
          />
          <h2 className="text-lg font-semibold text-stone-900">
            Found {results.length} email{results.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {selectedIds.size > 0 && (
          <Button
            size="sm"
            onClick={handleBulkDownload}
            loading={bulkDownloading}
            className="bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-500"
          >
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
            Download {selectedIds.size} selected as ZIP
          </Button>
        )}
      </div>

      {/* Result rows */}
      <div className="mt-4 space-y-2">
        {results.map((result) => (
          <ResultRow
            key={result.messageId}
            result={result}
            selected={selectedIds.has(result.messageId)}
            onToggleSelect={handleToggleSelect}
          />
        ))}
      </div>
    </div>
  );
}
