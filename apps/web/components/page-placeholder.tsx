import { Hammer } from "lucide-react";

export function ComingSoon({
  title,
  description,
  badge,
}: {
  title: string;
  description?: string;
  badge?: string;
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-2 flex items-center gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {badge && (
          <span className="rounded-full bg-brand/12 px-2.5 py-1 text-xs font-semibold text-brand">{badge}</span>
        )}
      </div>
      <div className="mt-6 grid place-items-center rounded-3xl border border-dashed border-border bg-card py-24 text-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-brand/10 text-brand">
          <Hammer className="size-7" />
        </span>
        <p className="mt-4 text-lg font-bold">Em construção</p>
        {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}
