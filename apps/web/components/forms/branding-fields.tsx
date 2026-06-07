"use client";

import { Sparkles } from "lucide-react";
import { THEME_PRESETS, ALLOWED_RADII, type ThemeInput } from "@timeup/core";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const HEX = /^#([0-9a-fA-F]{6})$/;

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 cursor-pointer rounded-lg border border-border bg-card p-0.5"
          aria-label={label}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (HEX.test(v) || v.startsWith("#")) onChange(v.toUpperCase());
          }}
          className="h-9 w-28 rounded-md border border-input bg-background px-2 text-sm uppercase tabnums outline-none focus-visible:ring-2 focus-visible:ring-ring"
          maxLength={7}
        />
      </div>
    </div>
  );
}

const RADIUS_LABELS: Record<string, string> = {
  "0rem": "Reto",
  "0.25rem": "XS",
  "0.5rem": "S",
  "0.625rem": "M",
  "0.75rem": "L",
  "1rem": "XL",
};

export function BrandingFields({ value, onChange }: { value: ThemeInput; onChange: (next: ThemeInput) => void }) {
  const set = (patch: Partial<ThemeInput>) => onChange({ ...value, ...patch });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
      <div className="space-y-5">
        <div>
          <Label className="mb-2 block">Predefinições</Label>
          <div className="flex flex-wrap gap-2">
            {THEME_PRESETS.map((p) => {
              const activePreset = value.brand.toUpperCase() === p.brand.toUpperCase();
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => set({ brand: p.brand, accent: p.accent, sidebar: "#FFFFFF" })}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    activePreset ? "border-brand bg-brand/10 text-brand" : "border-border hover:bg-secondary",
                  )}
                >
                  <span className="size-3 rounded-full" style={{ backgroundColor: p.brand }} />
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <ColorField label="Cor da marca" value={value.brand} onChange={(v) => set({ brand: v })} />
          <ColorField label="Destaque" value={value.accent} onChange={(v) => set({ accent: v })} />
          <ColorField label="Sidebar" value={value.sidebar} onChange={(v) => set({ sidebar: v })} />
        </div>

        <div>
          <Label className="mb-2 block">Arredondamento</Label>
          <div className="flex flex-wrap gap-2">
            {ALLOWED_RADII.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => set({ radius: r })}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                  value.radius === r ? "border-brand bg-brand/10 text-brand" : "border-border hover:bg-secondary",
                )}
              >
                {RADIUS_LABELS[r] ?? r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* live preview */}
      <div className="space-y-2">
        <Label className="block">Pré-visualização</Label>
        <div
          className="overflow-hidden border shadow-soft"
          style={{ borderRadius: `calc(${value.radius} + 4px)`, background: "#fff", borderColor: "var(--border)" }}
        >
          <div
            className="flex h-20 items-center gap-2 px-4 text-white"
            style={{ background: `linear-gradient(120deg, ${value.brand}, color-mix(in srgb, ${value.brand} 75%, #000))` }}
          >
            <span className="grid size-8 place-items-center rounded-lg bg-white/20">
              <Sparkles className="size-4" />
            </span>
            <span className="font-bold">Sua Empresa</span>
          </div>
          <div className="space-y-2 p-4">
            <div className="h-2 w-3/4 rounded-full" style={{ background: value.brand, borderRadius: value.radius }} />
            <div className="h-2 w-1/2 rounded-full bg-secondary" />
            <div className="flex gap-2 pt-1">
              <span className="rounded-md px-2 py-1 text-xs font-semibold text-white" style={{ background: value.brand, borderRadius: value.radius }}>
                Botão
              </span>
              <span className="rounded-md px-2 py-1 text-xs font-semibold" style={{ background: `${value.accent}22`, color: value.accent, borderRadius: value.radius }}>
                Tag
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
