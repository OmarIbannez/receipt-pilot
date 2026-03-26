"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ExpenseList from "@/components/ExpenseList";
import ScanButton from "@/components/ScanButton";
import FilterBar from "@/components/FilterBar";
import DownloadPanel from "@/components/DownloadPanel";
import CategoryChart from "@/components/CategoryChart";
import type { ExpenseWithAttachments, DashboardStats } from "@/types";

interface Filters {
  categories: string[];
  dateFrom: string;
  dateTo: string;
  search: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [expenses, setExpenses] = useState<ExpenseWithAttachments[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    categories: [],
    dateFrom: "",
    dateTo: "",
    search: "",
  });

  if (status === "unauthenticated") {
    redirect("/");
  }

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.categories.length > 0) params.set("categories", filters.categories.join(","));
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.search) params.set("search", filters.search);

      const res = await fetch(`/api/expenses?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses);
        setStats(data.stats);
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchExpenses();
    }
  }, [status, fetchExpenses]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === expenses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(expenses.map((e) => e.id)));
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-300 border-t-stone-900" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
            <p className="text-sm text-stone-500">
              Your expense receipts from Gmail
            </p>
          </div>
          <ScanButton onScanComplete={fetchExpenses} />
        </div>

        {/* Stats */}
        {stats && (
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-stone-500">Total Amount</p>
              <p className="mt-1 font-mono text-2xl font-bold text-stone-900">
                $
                {stats.totalAmount.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-stone-500">Expenses Found</p>
              <p className="mt-1 font-mono text-2xl font-bold text-stone-900">
                {stats.expenseCount}
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-stone-500">With PDF Attachments</p>
              <p className="mt-1 font-mono text-2xl font-bold text-stone-900">
                {stats.withPdfs}
              </p>
            </div>
          </div>
        )}

        {/* Category chart */}
        {stats && Object.keys(stats.categories).length > 0 && (
          <div className="mt-8">
            <CategoryChart categories={stats.categories} />
          </div>
        )}

        {/* Filters + Download Panel */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <FilterBar filters={filters} onFilterChange={setFilters} />
          {selectedIds.size > 0 && (
            <DownloadPanel
              selectedIds={selectedIds}
            />
          )}
        </div>

        {/* Expense list */}
        <div className="mt-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-stone-200"
                />
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white py-20 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                <svg
                  className="h-8 w-8 text-stone-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-stone-900">
                No expenses yet
              </h3>
              <p className="mt-1 text-sm text-stone-500">
                Click &quot;Scan Gmail&quot; to find your receipts and invoices.
              </p>
            </div>
          ) : (
            <ExpenseList
              expenses={expenses}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
            />
          )}
        </div>
      </main>
    </div>
  );
}
