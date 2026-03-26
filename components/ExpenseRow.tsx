"use client";

import { useState } from "react";
import { format } from "date-fns";
import Badge from "@/components/ui/Badge";
import type { ExpenseWithAttachments } from "@/types";

interface ExpenseRowProps {
  expense: ExpenseWithAttachments;
  selected: boolean;
  onSelect: (id: string) => void;
}

function formatCurrency(amount: number | null, currency: string): string {
  if (amount === null) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "..." : text;
}

export default function ExpenseRow({
  expense,
  selected,
  onSelect,
}: ExpenseRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-stone-100 last:border-b-0">
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(expense.id)}
          className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
        />

        <Badge category={expense.category} />

        <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-900">
          {truncate(expense.subject, 60)}
        </span>

        <span className="hidden sm:block text-sm text-stone-500 w-32 truncate">
          {expense.fromName ?? expense.fromEmail}
        </span>

        <span className="text-sm text-stone-500 w-24 text-right">
          {format(new Date(expense.emailDate), "MMM d, yyyy")}
        </span>

        <span className="w-28 text-right font-mono text-sm font-medium text-stone-900">
          {formatCurrency(expense.amount, expense.currency)}
        </span>

        {/* Attachment count */}
        {expense.attachments.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-stone-400">
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
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
            {expense.attachments.length}
          </span>
        )}

        {/* Expand button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-stone-100 bg-stone-50 px-4 py-4 pl-12">
          {expense.snippet && (
            <p className="mb-3 text-sm text-stone-600 leading-relaxed">
              {expense.snippet}
            </p>
          )}

          {expense.attachments.length > 0 && (
            <div className="mb-3">
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">
                Attachments
              </h4>
              <ul className="space-y-1">
                {expense.attachments.map((att) => (
                  <li key={att.id} className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-stone-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                      />
                    </svg>
                    <a
                      href={`/api/download/${att.id}`}
                      className="text-sm text-amber-700 hover:text-amber-900 underline underline-offset-2"
                    >
                      {att.filename}
                    </a>
                    <span className="text-xs text-stone-400">
                      ({(att.size / 1024).toFixed(0)} KB)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {expense.gmailUrl && (
            <a
              href={expense.gmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-900 font-medium"
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
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Open in Gmail
            </a>
          )}
        </div>
      )}
    </div>
  );
}
