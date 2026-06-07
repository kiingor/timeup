export const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export interface Period {
  year: number;
  month: number;
}

export function currentPeriod(): Period {
  const n = new Date();
  return { year: n.getUTCFullYear(), month: n.getUTCMonth() + 1 };
}

/** Parse ?ano= / ?mes= search params, falling back to the current period. */
export function parsePeriod(sp: { ano?: string; mes?: string } | undefined): Period {
  const cur = currentPeriod();
  const year = sp?.ano ? Number(sp.ano) : cur.year;
  const month = sp?.mes ? Number(sp.mes) : cur.month;
  const validYear = Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : cur.year;
  const validMonth = Number.isInteger(month) && month >= 1 && month <= 12 ? month : cur.month;
  return { year: validYear, month: validMonth };
}

export function periodLabel(year: number, month: number): string {
  return `${MONTHS_PT[month - 1]} ${year}`;
}

/** Parse the ?empresa= filter. Returns the empresa id, or null for "Todas as empresas". */
export function parseEmpresa(sp: { empresa?: string } | undefined): string | null {
  return sp?.empresa && sp.empresa !== "all" ? sp.empresa : null;
}

/** Build a list of recent {year, month} options for the selector. */
export function recentPeriods(count = 12): Period[] {
  const { year, month } = currentPeriod();
  const out: Period[] = [];
  let y = year;
  let m = month;
  for (let i = 0; i < count; i++) {
    out.push({ year: y, month: m });
    m -= 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
  }
  return out;
}
