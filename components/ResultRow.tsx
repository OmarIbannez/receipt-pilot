"use client";

import { useState } from "react";
import type { EmailResult } from "@/components/ScanForm";
import Button from "@/components/ui/Button";

interface ResultRowProps {
  result: EmailResult;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}

async function triggerDownload(
  body: Record<string, string>,
  fallbackFilename: string
) {
  const res = await fetch("/api/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Download failed");

  const blob = await res.blob();

  // Try to get filename from Content-Disposition header
  const disposition = res.headers.get("Content-Disposition");
  let filename = fallbackFilename;
  if (disposition) {
    const match = disposition.match(/filename="?([^";\n]+)"?/);
    if (match) filename = match[1];
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ResultRow({
  result,
  selected,
  onToggleSelect,
}: ResultRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const formattedDate = new Date(result.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const handleDownload = async (
    body: Record<string, string>,
    key: string,
    fallbackFilename: string
  ) => {
    setDownloading(key);
    try {
      await triggerDownload(body, fallbackFilename);
    } catch {
      // silently fail for now
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm transition-colors hover:border-stone-300">
      {/* Main row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect(result.messageId);
          }}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
        />

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-stone-900">
              {result.subject}
            </h3>
            {result.hasAttachments && (
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
                {result.attachments.length}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-stone-500">
            <span>{result.from}</span>
            <span className="text-stone-300">|</span>
            <span>{formattedDate}</span>
          </div>
          {!expanded && (
            <p className="mt-1 truncate text-xs text-stone-400">
              {result.snippet}
            </p>
          )}
        </div>

        {/* Expand indicator */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 text-stone-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-stone-100 px-4 py-4">
          <p className="text-sm text-stone-600">{result.snippet}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {/* Download .eml */}
            <Button
              variant="secondary"
              size="sm"
              loading={downloading === "eml"}
              onClick={() =>
                handleDownload(
                  { messageId: result.messageId, type: "eml" },
                  "eml",
                  `${result.subject.replace(/[^a-zA-Z0-9]/g, "_")}.eml`
                )
              }
            >
              Download .eml
            </Button>

            {/* Download as HTML */}
            <Button
              variant="secondary"
              size="sm"
              loading={downloading === "pdf"}
              onClick={() =>
                handleDownload(
                  { messageId: result.messageId, type: "pdf" },
                  "pdf",
                  `${result.subject.replace(/[^a-zA-Z0-9]/g, "_")}.html`
                )
              }
            >
              Download as HTML
            </Button>

            {/* Attachment downloads */}
            {result.attachments.map((att) => (
              <Button
                key={att.attachmentId}
                variant="secondary"
                size="sm"
                loading={downloading === att.attachmentId}
                onClick={() =>
                  handleDownload(
                    {
                      messageId: result.messageId,
                      type: "attachment",
                      attachmentId: att.attachmentId,
                      filename: att.filename,
                    },
                    att.attachmentId,
                    att.filename
                  )
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
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
                {att.filename}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
