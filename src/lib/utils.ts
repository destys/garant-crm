import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

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
