export function SkeletonCard() {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 sm:p-5">
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-64 animate-pulse rounded bg-slate-100" />
        <div className="flex gap-2">
          <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
      <div className="ml-3 h-10 w-10 animate-pulse rounded-lg bg-slate-100 sm:ml-4 sm:h-12 sm:w-12" />
    </div>
  );
}

export function SkeletonMapPlaceholder() {
  return (
    <div className="flex h-[250px] flex-col items-center justify-center rounded-xl bg-slate-100">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
      <p className="mt-2 text-xs text-slate-400">
        Chargement de la carte…
      </p>
    </div>
  );
}
