export type MilestoneDisplayFormat = "automatic" | "total_days" | "years_months_days";

function dateOnly(value: string | Date) {
  const date = value instanceof Date ? new Date(value) : new Date(value.includes("T") ? value : `${value}T00:00:00`);
  return Number.isFinite(date.getTime()) ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : null;
}

export function milestoneParts(start?: string | null, now = new Date()) {
  const from = start ? dateOnly(start) : null;
  const to = dateOnly(now);
  if (!from || !to || from > to) return { years: 0, months: 0, days: 0, totalDays: 0 };
  const totalDays = Math.floor((to.getTime() - from.getTime()) / 86400000);
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();
  if (days < 0) { months -= 1; days += new Date(to.getFullYear(), to.getMonth(), 0).getDate(); }
  if (months < 0) { years -= 1; months += 12; }
  return { years: Math.max(0, years), months: Math.max(0, months), days: Math.max(0, days), totalDays };
}

export function formatMilestoneDuration(start: string | null | undefined, format: MilestoneDisplayFormat = "automatic", now = new Date()) {
  const parts = milestoneParts(start, now);
  if (format === "total_days") return `${parts.totalDays} ${parts.totalDays === 1 ? "day" : "days"}`;
  const all = [[parts.years, "year"], [parts.months, "month"], [parts.days, "day"]] as const;
  const values = format === "years_months_days" ? all : all.filter(([value]) => value > 0);
  if (!values.length) return "0 days";
  return values.map(([value, unit]) => `${value} ${value === 1 ? unit : `${unit}s`}`).join(", ");
}
