/**
 * utils.ts — Funciones de mapeo y utilidades compartidas de @menu-bites/auth.
 * mapMenuItem / mapCategory / mapTable / mapOrder: convierten filas snake_case de Supabase
 * a los tipos camelCase exportados por types.ts.
 * Utilidades de formato: formatCLP, formatDateTime, timeAgo, formatCLP, diffMinutes, pluralize.
 * getPublicImageUrl: resuelve rutas relativas de Supabase Storage a URLs públicas.
 */

import { supabase } from "./index";
import { MenuItem, TableRecord, Order, Category } from "./types";

/** Convierte una fila de menu_items (snake_case) al tipo MenuItem (camelCase). */
export const mapMenuItem = (item: any): MenuItem => ({
  ...item,
  categoryId: item.category_id,
  imageUrl: item.image_url,
  isActive: item.is_active,
  restaurantId: item.restaurant_id
});

/** Convierte una fila de categories (snake_case) al tipo Category (camelCase). */
export const mapCategory = (cat: any): Category => ({
  ...cat,
  restaurantId: cat.restaurant_id,
  targetStation: cat.target_station,
  isActive: cat.is_active,
  is_active: cat.is_active,
});

/** Convierte una fila de tables (snake_case) al tipo TableRecord (camelCase). */
export const mapTable = (t: any): TableRecord => ({
  ...t,
  restaurantId: t.restaurant_id,
  qrData: t.qr_data,
  billRequested: t.bill_requested,
  helpRequested: t.help_requested
});

/**
 * Convierte una fila de orders con joins (snake_case) al tipo Order (camelCase).
 * Normaliza los alias de order_items / items y maneja campos opcionales de sub-órdenes.
 */
export const mapOrder = (o: any): Order => ({
  ...o,
  restaurantId: o.restaurant_id,
  tableId: o.table_id,
  userId: o.user_id,
  sessionId: o.session_id,
  totalAmount: Number(o.total_amount),
  createdAt: o.created_at || o.createdAt,
  validatedAt: o.validated_at,
  preparingAt: o.preparing_at,
  readyAt: o.ready_at,
  station: o.station ?? null,
  parentOrderId: o.parent_order_id ?? null,
  kitchenReady: o.kitchen_ready ?? o.kitchenReady ?? false,
  barReady: o.bar_ready ?? o.barReady ?? false,
  kitchenPreparing: o.kitchen_preparing ?? o.kitchenPreparing ?? false,
  barPreparing: o.bar_preparing ?? o.barPreparing ?? false,
  orderItems: (o.order_items || o.items)?.map((oi: any) => ({
    ...oi,
    orderId: oi.order_id,
    menuItemId: oi.menu_item_id,
    restaurantId: oi.restaurant_id,
    unitPrice: Number(oi.unit_price),
    menuItem: oi.menu_items || oi.menu_item ? {
      name: (oi.menu_items || oi.menu_item).name,
      category: (oi.menu_items || oi.menu_item).category
        ? { targetStation: (oi.menu_items || oi.menu_item).category.target_station }
        : null
    } : null
  }))
});

export function formatCLP(n: number): string {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n);
}

/** Formatea una fecha ISO a 'dd/mm/aaaa hh:mm' en locale chileno. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/** Retorna tiempo relativo legible desde una fecha ISO (ej. '3 min', '1h'). */
export function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "Ahora";
  if (diff === 1) return "1 min";
  if (diff < 60) return `${diff} min`;
  return `${Math.floor(diff / 60)}h`;
}

/** Calcula el subtotal de un ítem de pedido (unit_price × quantity). */
export function orderItemTotal(item: { unit_price: number | string; quantity: number }): number {
  return Number(item.unit_price) * item.quantity;
}

/** Diferencia en minutos entre dos fechas ISO. Retorna null si alguna es inválida. */
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

/**
 * Helper to get the public URL for an image stored in Supabase Storage.
 * Handles both full URLs and relative storage paths.
 */
export const getPublicImageUrl = (path: string | null) => {
  if (!path) return "/placeholder-food.jpg";
  if (path.startsWith("http")) return path;

  const { data } = supabase.storage
    .from("menu-images")
    .getPublicUrl(path);

  return data.publicUrl;
};
