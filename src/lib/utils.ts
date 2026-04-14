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

/**
 * Нормализация телефона в международный вид только из цифр (без +), для wa.me / t.me.
 * РФ: 8XXXXXXXXXX → 7XXXXXXXXXX; 10 цифр → добавляется 7.
 */
export function normalizePhoneDigits(phone?: string | null): string | null {
  if (!phone) return null;
  let d = phone.replace(/\D/g, "");
  if (!d) return null;
  if (d.length === 11 && d.startsWith("8")) {
    d = "7" + d.slice(1);
  }
  if (d.length === 10 && !d.startsWith("7")) {
    d = "7" + d;
  }
  return d;
}

/** Ссылка WhatsApp по номеру */
export function buildWhatsappUrl(phone?: string | null): string | null {
  const d = normalizePhoneDigits(phone);
  if (!d) return null;
  return `https://wa.me/${d}`;
}

/**
 * Ссылка Telegram по номеру (чат по телефону).
 * Важно: нужен префикс + в пути, иначе t.me воспринимает строку как @username.
 */
export function buildTelegramUrl(phone?: string | null): string | null {
  const d = normalizePhoneDigits(phone);
  if (!d) return null;
  return `https://t.me/+${d}`;
}
