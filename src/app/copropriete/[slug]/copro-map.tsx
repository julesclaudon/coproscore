"use client";

import dynamic from "next/dynamic";

const CoproMapInner = dynamic(() => import("@/components/copro-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-lg bg-slate-100">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
      <p className="mt-2 text-xs text-slate-400">Chargement de la carte&hellip;</p>
    </div>
  ),
});

export { CoproMapInner as CoproMap };
