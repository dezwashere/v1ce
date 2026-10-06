export const SUBSTANCES = [
  "Alcohol",
  "Benzodiazepines",
  "Caffeine",
  "Cannabis",
  "Cocaine",
  "Gambling",
  "Methamphetamine",
  "Nicotine",
  "OCD Compulsions",
  "Opioids",
  "Prescription Drugs",
  "Social Media",
  "Sugar",
  "Other",
];

export const ONBOARDING_SUBSTANCES = [
  "Alcohol",
  "Cannabis",
  "Cocaine",
  "Opioids",
  "Meth",
  "Benzodiazepines",
  "Nicotine",
  "Sugar",
  "Gambling",
  "OCD Compulsions",
  "Other",
];

export const MILESTONES = [
  { days: 1, label: "1 DAY", message: "The journey begins. You took the first step." },
  { days: 7, label: "1 WEEK", message: "One week strong. Keep going!" },
  { days: 30, label: "1 MONTH", message: "A full month of courage. Incredible!" },
  { days: 60, label: "60 DAYS", message: "60 days of strength. You're building momentum." },
  { days: 90, label: "90 DAYS", message: "A quarter year! The foundation is set." },
  { days: 180, label: "6 MONTHS", message: "Half a year of freedom. Amazing progress!" },
  { days: 365, label: "1 YEAR", message: "One incredible year. You did it!" },
  { days: 730, label: "2 YEARS", message: "Two years strong. You're an inspiration." },
  { days: 1825, label: "5 YEARS", message: "Five years of freedom. Legendary." },
];

export const ROTATING_WORDS = [
  "SOBER",
  "UNBOTHERED",
  "HYDRATED",
  "EMPLOYABLE",
  "ASCENDING",
  "CRAZY",
  "SLAYING",
  "FEELING",
  "EXPERIENCING",
  "SHOWING UP",
  "CAFFEINATED",
  "UNHINGED",
  "VALID",
  "VIBING",
  "GRATEFUL",
  "PROUD",
  "CLEAN",
  "HAPPY",
  "RICH",
  "LOVED",
];

export const ROTATING_LABELS = ["DAYS SOBER", "CLEAN TIME", "DAYS FREE", "DAYS STRONG", "ONE DAY AT A TIME"];

export const COLOR_SWATCHES = [
  "#F5D680",
  "#E0E0E0",
  "#CD7F32",
  "#E8B4B8",
  "#0A0A0A",
  "#2E8B57",
  "#F5A41A",
  "#FFFFFF",
  "#4A90D9",
  "#E74C3C",
  "#9B59B6",
  "#1ABC9C",
  "#F39C12",
  "#E91E63",
  "#00BCD4",
  "#8D6E63",
  "#607D8B",
  "#FFD700",
  "#C0C0C0",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#7F8C8D",
];

export const BACKGROUNDS = ["solid", "zebra", "leopard", "space", "lightning", "slime", "flames", "hotpink"] as const;

export function daysSince(start?: string | null) {
  if (!start) return 0;
  const date = new Date(start.includes("T") ? start : `${start}T00:00:00`);
  if (!Number.isFinite(date.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

export function getElapsed(start?: string, now = Date.now()) {
  if (!start) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const date = new Date(start.includes("T") ? start : `${start}T00:00:00`);
  if (!Number.isFinite(date.getTime())) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const ms = Math.max(0, now - date.getTime());
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor(ms / 3600000) % 24,
    minutes: Math.floor(ms / 60000) % 60,
    seconds: Math.floor(ms / 1000) % 60,
  };
}
