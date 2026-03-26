"use client";

interface CategoryChartProps {
  categories: Record<string, number>;
}

const barColors: Record<string, string> = {
  RIDESHARE: "bg-blue-500",
  FOOD_DELIVERY: "bg-orange-500",
  TRAVEL: "bg-purple-500",
  SUBSCRIPTIONS: "bg-pink-500",
  SHOPPING: "bg-emerald-500",
  UTILITIES: "bg-yellow-500",
  INSURANCE: "bg-slate-500",
  HEALTHCARE: "bg-red-500",
  ENTERTAINMENT: "bg-violet-500",
  EDUCATION: "bg-cyan-500",
  OTHER: "bg-stone-500",
};

function formatLabel(category: string): string {
  return category
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CategoryChart({ categories }: CategoryChartProps) {
  const entries = Object.entries(categories).sort(([, a], [, b]) => b - a);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-stone-400">No category data available.</p>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map(([category, amount]) => (
        <div key={category} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-stone-700">
              {formatLabel(category)}
            </span>
            <span className="font-mono text-stone-500">
              {formatCurrency(amount)}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-stone-100">
            <div
              className={`h-2 rounded-full transition-all ${barColors[category] ?? "bg-stone-500"}`}
              style={{ width: `${(amount / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
