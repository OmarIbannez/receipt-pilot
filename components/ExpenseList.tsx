"use client";

import ExpenseRow from "@/components/ExpenseRow";
import type { ExpenseWithAttachments } from "@/types";

interface ExpenseListProps {
  expenses: ExpenseWithAttachments[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
}

export default function ExpenseList({
  expenses,
  selectedIds,
  onToggleSelect,
  onSelectAll,
}: ExpenseListProps) {
  const allSelected =
    expenses.length > 0 && expenses.every((e) => selectedIds.has(e.id));

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 border-b border-stone-200 bg-stone-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={onSelectAll}
          className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
        />
        <span className="w-28">Category</span>
        <span className="flex-1">Subject</span>
        <span className="hidden sm:block w-32">From</span>
        <span className="w-24 text-right">Date</span>
        <span className="w-28 text-right">Amount</span>
        <span className="w-10" />
        <span className="w-6" />
      </div>

      {/* Rows */}
      {expenses.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-stone-400">
          No expenses found. Try scanning your Gmail or adjusting filters.
        </div>
      ) : (
        expenses.map((expense) => (
          <ExpenseRow
            key={expense.id}
            expense={expense}
            selected={selectedIds.has(expense.id)}
            onSelect={onToggleSelect}
          />
        ))
      )}
    </div>
  );
}
