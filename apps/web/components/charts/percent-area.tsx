"use client";

import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPct } from "@timeup/core";

export function PercentArea({ data }: { data: { date: string; cumulativePct: number }[] }) {
  const chart = data.map((d) => ({ day: d.date.slice(8, 10), pct: d.cumulativePct }));
  // axis always reaches at least 100% so the dashed meta line is visible; grows past it for over-achievers
  const maxPct = Math.max(1, ...chart.map((c) => c.pct));

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chart} margin={{ top: 8, right: 8, bottom: 0, left: -4 }}>
          <defs>
            <linearGradient id="pctGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            width={44}
            domain={[0, maxPct]}
            tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`}
          />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} dy={6} />
          <Tooltip
            cursor={{ stroke: "var(--border)" }}
            contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }}
            labelFormatter={(l) => `Dia ${l}`}
            formatter={(v: number) => [formatPct(Number(v)), "Evolução"]}
          />
          <ReferenceLine y={1} stroke="var(--success)" strokeDasharray="4 4" />
          <Area type="monotone" dataKey="pct" stroke="var(--brand)" strokeWidth={2.5} fill="url(#pctGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
