"use client";

import { useState, useRef, useEffect } from "react";

const ALL_CATEGORIES = [
  "RIDESHARE",
  "FOOD_DELIVERY",
  "TRAVEL",
  "SUBSCRIPTIONS",
  "SHOPPING",
  "UTILITIES",
  "INSURANCE",
  "HEALTHCARE",
  "ENTERTAINMENT",
  "EDUCATION",
  "OTHER",
] as const;

interface Filters {
  categories: string[];
  dateFrom: string;
  dateTo: string;
  search: string;
}

interface FilterBarProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

function formatLabel(category: string): string {
  return category
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggleCategory(cat: string) {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    onFilterChange({ ...filters, categories: next });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Category multi-select */}
      <div className="relative" ref={catRef}>
        <button
          onClick={() => setCatOpen(!catOpen)}
          className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
        >
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
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Categories
          {filters.categories.length > 0 && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
              {filters.categories.length}
            </span>
          )}
        </button>

        {catOpen && (
          <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
            {ALL_CATEGORIES.map((cat) => (
              <label
                key={cat}
                className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
              >
                <input
                  type="checkbox"
                  checked={filters.categories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                />
                {formatLabel(cat)}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Date range */}
      <input
        type="date"
        value={filters.dateFrom}
        onChange={(e) =>
          onFilterChange({ ...filters, dateFrom: e.target.value })
        }
        placeholder="From"
        className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-500"
      />
      <span className="text-sm text-stone-400">to</span>
      <input
        type="date"
        value={filters.dateTo}
        onChange={(e) =>
          onFilterChange({ ...filters, dateTo: e.target.value })
        }
        placeholder="To"
        className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-500"
      />

      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={filters.search}
          onChange={(e) =>
            onFilterChange({ ...filters, search: e.target.value })
          }
          placeholder="Search expenses..."
          className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-500"
        />
      </div>
    </div>
  );
}
