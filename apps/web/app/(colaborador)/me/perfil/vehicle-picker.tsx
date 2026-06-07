"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { PixelVehicle, VEHICLES, DEFAULT_VEHICLE } from "@/components/vehicles/pixel-vehicle";
import { setVehicle } from "@/app/(colaborador)/me/actions";

export function VehiclePicker({ current }: { current: string | null }) {
  const router = useRouter();
  const [selected, setSelected] = useState(current || DEFAULT_VEHICLE);
  const [busy, setBusy] = useState<string | null>(null);

  async function pick(id: string) {
    if (busy) return;
    setSelected(id);
    setBusy(id);
    try {
      const res = await setVehicle(id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Personagem atualizado! 🏁");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {VEHICLES.map((v) => {
        const active = selected === v.id;
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => pick(v.id)}
            disabled={!!busy}
            className={`relative flex flex-col items-center gap-2 rounded-2xl border p-4 transition-colors disabled:opacity-70 ${
              active ? "border-brand bg-brand/8 ring-1 ring-brand" : "border-border bg-card hover:bg-secondary/60"
            }`}
          >
            {active && (
              <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-brand text-brand-foreground">
                <Check className="size-3" strokeWidth={3} />
              </span>
            )}
            <div className="grid h-12 place-items-center">
              {busy === v.id ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : <PixelVehicle id={v.id} size={56} />}
            </div>
            <span className="text-center text-xs font-semibold leading-tight">{v.label}</span>
          </button>
        );
      })}
    </div>
  );
}
