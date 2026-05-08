import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | undefined | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha inválida";
  return date.toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(value);
}

export function timeAgo(value: string): string {
  const diff = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (diff < 1) return "Hace un momento";
  if (diff === 1) return "Hace 1 min";
  if (diff < 60) return `Hace ${diff} min`;
  const hrs = Math.floor(diff / 60);
  return `Hace ${hrs}h ${diff % 60}min`;
}
