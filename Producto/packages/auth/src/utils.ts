// Utilidades de negocio compartidas entre todas las apps del monorepo.
// Importar desde "@menu-bites/auth".

export function formatCLP(n: number): string {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n);
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "Ahora";
  if (diff === 1) return "1 min";
  if (diff < 60) return `${diff} min`;
  return `${Math.floor(diff / 60)}h`;
}

export function orderItemTotal(item: { unit_price: number | string; quantity: number }): number {
  return Number(item.unit_price) * item.quantity;
}

export function diffMinutes(
  a: string | null | undefined,
  b: string | null | undefined,
): number | null {
  if (!a || !b) return null;
  return (new Date(b).getTime() - new Date(a).getTime()) / 60000;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}
