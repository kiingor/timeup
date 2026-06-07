"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatBRL, formatBRLCompact } from "@timeup/core";

export interface ColabBarPoint {
  name: string;
  realized: number;
  rank: number | null;
}

/** Ranked horizontal bars of colaboradores by realized (current month). First place
 *  gets the brand accent; the rest a pastel brand tint — mirrors EvolutionBar's idiom. */
export function ColabComparisonBar({ data }: { data: ColabBarPoint[] }) {
  const rows = data.map((d, i) => ({ ...d, top: i === 0 }));
  const height = Math.max(160, rows.length * 46);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={rows} margin={{ top: 4, right: 16, bottom: 0, left: 0 }} barCategoryGap="26%">
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            tickFormatter={(v) => formatBRLCompact(Number(v))}
          />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            width={104}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          />
          <Tooltip
            cursor={{ fill: "var(--secondary)", radius: 8 }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              boxShadow: "0 12px 32px -16px rgba(16,24,40,.2)",
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--muted-foreground)", fontWeight: 600 }}
            formatter={(value: number) => [formatBRL(Number(value)), "Realizado"]}
          />
          <Bar dataKey="realized" radius={[8, 8, 8, 8]} maxBarSize={26}>
            {rows.map((d, i) => (
              <Cell key={i} fill={d.top ? "var(--brand)" : "color-mix(in srgb, var(--brand) 22%, white)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
