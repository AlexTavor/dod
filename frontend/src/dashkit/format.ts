// Value + axis formatting shared by the atoms and (in W2b) the charts. Ported verbatim
// from the legacy dashkit.js so rendered output is byte-identical.

export const COLORS = [
  'var(--dk-c1)',
  'var(--dk-c2)',
  'var(--dk-c3)',
  'var(--dk-c4)',
  'var(--dk-c5)',
  'var(--dk-c6)',
];

/** A stable palette index, wrapped into range (negative-safe). */
export const color = (i: number): string => COLORS[(((Number(i) || 0) % 6) + 6) % 6];

/** Format a value for display: integers grouped, mid floats to 2dp, large floats to 1dp. */
export function fmt(v: number | string | null | undefined): string {
  if (v == null) return '–';
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return '–';
    if (Number.isInteger(v)) return v.toLocaleString();
    return Math.abs(v) >= 1000
      ? v.toLocaleString(undefined, { maximumFractionDigits: 1 })
      : v.toFixed(2);
  }
  return String(v);
}

/** Compact axis label: 1.2k / 3.4M / 5.6B. */
export function fmtAxis(v: number): string {
  const n = Number(v) || 0;
  const a = Math.abs(n);
  if (a >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/** X-axis label: ISO date-times are trimmed to the date. */
export function fmtX(v: unknown): string {
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  return String(v);
}

/** Truncate to n chars with an ellipsis. */
export function trunc(s: unknown, n: number): string {
  const str = String(s);
  return str.length > n ? `${str.slice(0, n - 1)}…` : str;
}
