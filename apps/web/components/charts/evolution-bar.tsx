"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatBRL, formatBRLCompact } from "@timeup/core";

export interface EvolutionPoint {
  label: string;
  value: number;
  highlight?: boolean;
}

export function EvolutionBar({ data }: { data: EvolutionPoint[] }) {
  return (
    <div className="h-[210px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -16 }} barCategoryGap="28%">
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            width={44}
            tickFormatter={(v) => formatBRLCompact(Number(v))}
          />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} dy={6} />
          <Tooltip
            cursor={{ fill: "var(--secondary)", radius: 8 }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              boxShadow: "0 12px 32px -16px rgba(16,24,40,.2)",
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--muted-foreground)", fontWeight: 600 }}
            formatter={(value: number) => [formatBRL(Number(value)), "Vendas"]}
          />
          <Bar dataKey="value" radius={[8, 8, 8, 8]} maxBarSize={44}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.highlight ? "var(--brand)" : "color-mix(in srgb, var(--brand) 22%, white)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
