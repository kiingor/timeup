"use client";

import { Bar, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatBRL, formatBRLCompact } from "@timeup/core";
import type { MonthPoint } from "@/lib/data/desempenho";

function TrendTooltip({ active, payload }: { active?: boolean; payload?: { payload: MonthPoint }[] }) {
  const first = payload?.[0];
  if (!active || !first) return null;
  const p = first.payload;
  const empty = p.faturamento === 0 && p.meta == null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-soft">
      <p className="mb-1 font-semibold text-muted-foreground">
        {p.label}
        {p.partial && <span className="ml-1 font-bold">· parcial</span>}
      </p>
      {empty ? (
        <p className="text-muted-foreground">Sem dados</p>
      ) : (
        <>
          <p className="tabnums font-bold">{formatBRL(p.faturamento)}</p>
          {p.meta != null && <p className="tabnums text-muted-foreground">Meta {formatBRL(p.meta)}</p>}
        </>
      )}
    </div>
  );
}

/** Store revenue bars per month + dashed meta line. Partial (current) month is rendered
 *  translucent so its mid-month value never reads as a drop; empty months show a faint sliver. */
export function FaturamentoMetaChart({ data }: { data: MonthPoint[] }) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }} barCategoryGap="30%">
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            width={64}
            tickFormatter={(v) => formatBRLCompact(Number(v))}
          />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} dy={6} />
          <Tooltip cursor={{ fill: "var(--secondary)", radius: 8 }} content={<TrendTooltip />} />
          <Bar dataKey="faturamento" radius={[8, 8, 8, 8]} maxBarSize={46}>
            {data.map((m, i) => (
              <Cell
                key={i}
                fill={
                  m.faturamento === 0 && m.meta == null
                    ? "var(--secondary)"
                    : m.partial
                      ? "color-mix(in srgb, var(--brand) 38%, white)"
                      : "var(--brand)"
                }
              />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="meta"
            stroke="var(--pink)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3, stroke: "var(--pink)", fill: "var(--card)" }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
