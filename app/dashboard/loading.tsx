export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="h-16 border-b border-stone-200 bg-white" />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-40 animate-pulse rounded bg-stone-200" />
            <div className="mt-2 h-4 w-60 animate-pulse rounded bg-stone-200" />
          </div>
          <div className="h-10 w-32 animate-pulse rounded-lg bg-stone-200" />
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl bg-stone-200"
            />
          ))}
        </div>
        <div className="mt-8 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-stone-200"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
