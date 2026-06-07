"use client";

import dynamic from "next/dynamic";
import type { RankingEntryDTO } from "@/lib/data/colaborador";

// Three.js is client-only — load the scene without SSR.
const Race3D = dynamic(() => import("./race-3d"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[360px] place-items-center rounded-xl border border-border bg-secondary text-sm text-muted-foreground sm:h-[420px]">
      Carregando pista 3D…
    </div>
  ),
});

export function Race3DLoader({ entries }: { entries: RankingEntryDTO[] }) {
  return <Race3D entries={entries} />;
}
