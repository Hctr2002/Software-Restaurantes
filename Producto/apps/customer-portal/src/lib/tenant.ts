/**
 * tenant.ts — Funciones de acceso a datos SIEMPRE filtradas por restaurant_id.
 * 
 * REGLA: Ninguna función aquí ejecuta queries sin restaurant_id.
 * El aislamiento multitenant se garantiza en este módulo.
 */

import { supabase } from './supabase';
import type { TenantRestaurant } from '@/context/TenantContext';

// ─────────────────────────────────────────────
// RESTAURANT (lookup inicial por slug)
// ─────────────────────────────────────────────

/**
 * Resuelve un restaurante por su slug único.
 * Usado en el layout de [restaurantSlug] para inicializar el tenant.
 * Retorna null si no existe o no está ACTIVE.
 */
export async function getRestaurantBySlug(slug: string): Promise<TenantRestaurant | null> {
  // La política RLS 'public_read_restaurants' ya filtra status = ACTIVE para anon.
  // No duplicamos el filtro aquí para evitar problemas con el cast del enum.
  const { data, error } = await supabase
    .from('restaurants')
    .select('id, name, slug, status')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('[tenant] getRestaurantBySlug error:', error.message, '| slug:', slug);
    return null;
  }
  return data as TenantRestaurant;
}

/**
 * Obtiene la lista de todos los restaurantes activos.
 * Útil para el directorio de la landing page.
 */
export async function getActiveRestaurants(): Promise<{id: string, name: string, slug: string}[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('id, name, slug')
    .eq('status', 'ACTIVE')
    .order('name');

  if (error) {
    console.error('[tenant] getActiveRestaurants error:', error.message);
    return [];
  }
  return data ?? [];
}


// ─────────────────────────────────────────────
// CATEGORÍAS
// ─────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
}

export async function getCategoriesByRestaurant(restaurantId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('[tenant] getCategoriesByRestaurant error:', error.message);
    return [];
  }
  return data ?? [];
}

// ─────────────────────────────────────────────
// ITEMS DEL MENÚ
// ─────────────────────────────────────────────

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  categoryId: string;
}

export async function getMenuItemsByRestaurant(restaurantId: string): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select('id, name, description, price, image_url, category_id')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true);

  if (error) {
    console.error('[tenant] getMenuItemsByRestaurant error:', error.message);
    return [];
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: Number(item.price),
    imageUrl: item.image_url,
    categoryId: item.category_id,
  }));
}

// ─────────────────────────────────────────────
// MESAS
// ─────────────────────────────────────────────

export interface Table {
  id: string;
  number: number;
  label: string | null;
  status: 'FREE' | 'OCCUPIED' | 'RESERVED';
}

export async function getTableByNumber(
  restaurantId: string,
  tableNumber: number
): Promise<Table | null> {
  const { data, error } = await supabase
    .from('tables')
    .select('id, number, label, status')
    .eq('restaurant_id', restaurantId)
    .eq('number', tableNumber)
    .single();

  if (error || !data) return null;
  return data as Table;
}

/**
 * Retorna todas las mesas de un restaurante, ordenadas por número.
 * Usada en el checkout para validar que el número de mesa existe en esa organización.
 */
export async function getTablesByRestaurant(restaurantId: string): Promise<Table[]> {
  const { data, error } = await supabase
    .from('tables')
    .select('id, number, label, status')
    .eq('restaurant_id', restaurantId)
    .order('number');

  if (error) {
    console.error('[tenant] getTablesByRestaurant error:', error.message);
    return [];
  }
  return (data ?? []) as Table[];
}

// ─────────────────────────────────────────────
// PEDIDOS
// ─────────────────────────────────────────────

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

/**
 * Coloca un pedido vía Route Handler server-side (/api/orders).
 * El servidor usa la Service Role Key → bypasea RLS sin exponer la key al browser.
 */
export async function placeOrder(
  restaurantId: string,
  tableNumber: string,
  cartItems: CartItem[]
): Promise<void> {
  const totalAmount = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const table = await getTableByNumber(restaurantId, parseInt(tableNumber));

  const res = await fetch('/api/orders', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurant_id: restaurantId,
      table_id:      table?.id ?? null,
      total_amount:  totalAmount,
      items: cartItems.map((item) => ({
        menu_item_id: item.id,
        quantity:     item.quantity,
        unit_price:   item.price,
      })),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(`[tenant] placeOrder: ${err.error}`);
  }
}

// ─────────────────────────────────────────────
// TEMAS Y BRANDING
// ─────────────────────────────────────────────

export interface RestaurantTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  cardBackground: string;
  fontTitle?: string;
  fontBody?: string;
  logoUrl?: string | null;
}

export async function getThemeByRestaurant(restaurantId: string): Promise<RestaurantTheme | null> {
  const { data, error } = await supabase
    .from('restaurant_themes')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  return {
    primaryColor: data.primary_color,
    secondaryColor: data.secondary_color,
    backgroundColor: data.background_color,
    accentColor: data.accent_color,
    textColor: data.text_color,
    cardBackground: data.card_background,
    fontTitle: data.font_title,
    fontBody: data.font_body,
    logoUrl: data.logo_url,
  };
}
