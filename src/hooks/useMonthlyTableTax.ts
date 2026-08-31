import { useEffect, useMemo, useState } from "react";

interface TaxRow { basis: number; tax: number; }
const tableCache = new Map<string, TaxRow[]>();
let sourcePromise: Promise<string> | null = null;

function loadSource(): Promise<string> {
  sourcePromise ??= fetch("/data/tax-tables-2026-monthly.txt").then(response => {
    if (!response.ok) throw new Error("Kunne ikke laste trekktabellene");
    return response.text();
  });
  return sourcePromise;
}

async function loadTable(tableNumber: string): Promise<TaxRow[]> {
  const cached = tableCache.get(tableNumber);
  if (cached) return cached;
  const source = await loadSource();
  const prefix = tableNumber.padStart(4, "0");
  const rows = source.split("\n")
    .filter(line => line.startsWith(prefix) && line[4] === "1" && line[5] === "0")
    .map(line => ({ basis: Number(line.slice(6, 12)), tax: Number(line.slice(12, 18)) }))
    .filter(row => Number.isFinite(row.basis) && Number.isFinite(row.tax));
  if (rows.length === 0) throw new Error("Tabellnummeret finnes ikke i 2026-tabellene");
  tableCache.set(tableNumber, rows);
  return rows;
}

function lookup(rows: TaxRow[], gross: number): number {
  const target = Math.max(0, gross);
  let low = 0;
  let high = rows.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (rows[middle].basis < target) low = middle + 1;
    else high = middle;
  }
  return rows[low]?.tax ?? 0;
}

export function useMonthlyTableTax(tableNumber: string, taxableGross: number) {
  const normalized = tableNumber.trim().padStart(4, "0");
  const [rows, setRows] = useState<TaxRow[] | null>(() => tableCache.get(normalized) ?? null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!/^\d{4}$/.test(normalized)) { setRows(null); setError(""); return; }
    let active = true;
    loadTable(normalized)
      .then(next => { if (active) { setRows(next); setError(""); } })
      .catch(reason => { if (active) { setRows(null); setError(reason instanceof Error ? reason.message : "Ukjent feil"); } });
    return () => { active = false; };
  }, [normalized]);

  const tax = useMemo(() => rows ? lookup(rows, taxableGross) : null, [rows, taxableGross]);
  return { tax, error, loading: /^\d{4}$/.test(normalized) && !rows && !error };
}
