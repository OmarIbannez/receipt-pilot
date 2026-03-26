interface BadgeProps {
  category: string;
  className?: string;
}

const categoryColors: Record<string, { dot: string; bg: string; text: string }> = {
  RIDESHARE:      { dot: "bg-blue-500",    bg: "bg-blue-50",    text: "text-blue-700" },
  FOOD_DELIVERY:  { dot: "bg-orange-500",  bg: "bg-orange-50",  text: "text-orange-700" },
  TRAVEL:         { dot: "bg-purple-500",  bg: "bg-purple-50",  text: "text-purple-700" },
  SUBSCRIPTIONS:  { dot: "bg-pink-500",    bg: "bg-pink-50",    text: "text-pink-700" },
  SHOPPING:       { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
  UTILITIES:      { dot: "bg-yellow-500",  bg: "bg-yellow-50",  text: "text-yellow-700" },
  INSURANCE:      { dot: "bg-slate-500",   bg: "bg-slate-50",   text: "text-slate-700" },
  HEALTHCARE:     { dot: "bg-red-500",     bg: "bg-red-50",     text: "text-red-700" },
  ENTERTAINMENT:  { dot: "bg-violet-500",  bg: "bg-violet-50",  text: "text-violet-700" },
  EDUCATION:      { dot: "bg-cyan-500",    bg: "bg-cyan-50",    text: "text-cyan-700" },
  OTHER:          { dot: "bg-stone-500",   bg: "bg-stone-100",  text: "text-stone-700" },
};

function formatLabel(category: string): string {
  return category
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Badge({ category, className = "" }: BadgeProps) {
  const colors = categoryColors[category] ?? categoryColors.OTHER;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {formatLabel(category)}
    </span>
  );
}
