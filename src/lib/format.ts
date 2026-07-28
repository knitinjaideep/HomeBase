/** Display formatting helpers. All returns are strings safe to render directly. */

const currency0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const currency2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

/** Whole-dollar currency, e.g. $1,100,000. Null/undefined → an em dash. */
export function money(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return currency0.format(Math.round(value));
}

/** Monthly currency rounded to the dollar, e.g. $8,042/mo. */
export function moneyPerMonth(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${currency2.format(Math.round(value))}/mo`;
}

/** Percentage with one decimal, e.g. 24.6%. */
export function percent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

/** Plain number or an em dash. */
export function num(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString("en-US");
}

/** Rating out of 5, e.g. "3.8 / 5". Null → em dash. */
export function rating(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value.toFixed(1)} / 5`;
}

/** A friendly date from an ISO string, e.g. "Jul 23, 2026". */
export function dateLabel(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/** A "YYYY-MM" month string to a label like "July 2026". */
export function monthLabel(ym: string | null | undefined): string {
  if (!ym) return "—";
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym ?? "—";
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { year: "numeric", month: "long" });
}

/** Turn a kebab/enum value into Title Case words. */
export function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** A relative expiry label for an ISO timestamp, e.g. "Expires in 18h", "Expired". */
export function expiresInLabel(iso: string | null | undefined): string {
  if (!iso) return "—";
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return "—";
  const diffMs = target - Date.now();
  if (diffMs <= 0) return "Expired";
  const hours = diffMs / (60 * 60 * 1000);
  if (hours < 1) return "Expires in under an hour";
  if (hours < 24) return `Expires in ${Math.round(hours)}h`;
  const days = Math.round(hours / 24);
  return `Expires in ${days}d`;
}
