import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formatea un número como monto en guaraníes con puntos de miles. Ej: 150000 → "150.000" */
export function formatMoney(value: number): string {
  if (!value) return "";
  return value.toLocaleString("es-PY");
}

/** Parsea un string con puntos de miles a número. Ej: "150.000" → 150000 */
export function parseMoney(value: string): number {
  return parseInt(value.replace(/\D/g, ""), 10) || 0;
}

/** Formatea el valor de un input de dinero mientras el usuario escribe. */
export function formatMoneyInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return parseInt(digits, 10).toLocaleString("es-PY");
}
