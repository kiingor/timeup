import type { LucideIcon } from "lucide-react";

const TONES = {
  brand: "bg-brand/12 text-brand",
  pink: "bg-pink/12 text-pink",
  info: "bg-info/15 text-info",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
} as const;

export function StatCard({
  icon: Icon,
  tone = "brand",
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  tone?: keyof typeof TONES;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between">
        <span className={`grid size-11 place-items-center rounded-xl ${TONES[tone]}`}>
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-4 text-2xl font-extrabold tabnums">{value}</p>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground/80">{hint}</p>}
    </div>
  );
}
