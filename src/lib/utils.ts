import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (
  date: Date | string,
  pattern: string = "dd MMMM yyyy"
) => {
  if (!date) return "";
  return format(new Date(date), pattern, { locale: ru });
};

export type Trend = "up" | "down";

export const compareValues = (current: number, prev: number) => {
  if (prev === 0) return { diff: current, percent: 100, trend: "up" as Trend };
  const diff = current - prev;
  const percent = Number(Math.abs((diff / prev) * 100).toFixed(1));
  return { diff, percent, trend: diff >= 0 ? "up" : ("down" as Trend) };
};

export const buildRange = (from: Date, to: Date) => ({
  $and: [
    { createdAt: { $gte: from.toISOString() } },
    { createdAt: { $lte: to.toISOString() } },
  ],
});

export const getMonthRanges = (base = new Date()) => {
  const prev = subMonths(base, 1);
  return {
    current: buildRange(startOfMonth(base), endOfMonth(base)),
    prev: buildRange(startOfMonth(prev), endOfMonth(prev)),
  };
};

export const formatName = (fullName?: string) => {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]; // если одно слово

  const [lastName, ...rest] = parts;
  const initials = rest.map((p) => p.charAt(0).toUpperCase() + ".").join(" ");
  return `${lastName} ${initials}`;
};

const KIND_PREFIX: Record<string, string> = {
  Выездной: "zov",
  UMedia: "u",
};
export const getPrefixByKind = (kind?: string) =>
  KIND_PREFIX[kind ?? ""] ?? "vz";

/**
 * Конвертирует Date в формат Strapi (yyyy-MM-dd)
 */
export const toStrapiDate = (d?: Date) =>
  d ? format(d, "yyyy-MM-dd") : undefined;

/**
 * Конвертирует строку Strapi в Date
 */
export const fromStrapiDate = (s?: string) =>
  s ? new Date(`${s}T00:00:00`) : undefined;
