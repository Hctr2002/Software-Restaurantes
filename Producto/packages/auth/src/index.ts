import { createBrowserClient } from '@supabase/ssr';
import { AlertType, StationType } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Named cookie per app so multiple sessions can coexist on the same localhost domain.
// Each app sets NEXT_PUBLIC_APP_KEY in its next.config.mjs env block.
const appKey = process.env.NEXT_PUBLIC_APP_KEY ?? 'default';
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  cookieOptions: { name: `sb-${appKey}-session` },
});

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const getAppMetadata = (session: any) => {
  return session?.user?.app_metadata || {};
};

export const signOut = async () => {
  await supabase.auth.signOut();
};

const STATUS_TIMESTAMP: Record<string, string> = {
  VALIDATED:  "validated_at",
  PREPARING:  "preparing_at",
  READY:      "ready_at",
};

export const updateOrderStatus = async (orderId: string, status: string, station?: StationType) => {
  const timestampField = STATUS_TIMESTAMP[status];
  const payload: Record<string, unknown> = {};
  if (timestampField) payload[timestampField] = new Date().toISOString();

  if (!station) {
    // Sin estación: actualización directa del estado global (garzon, cajero, etc.)
    payload.status = status;
    const { data, error } = await supabase.from("orders").update(payload).eq("id", orderId).select();
    return { data, error };
  }

  const isKitchen = station === "KITCHEN";
  const preparingField = isKitchen ? "kitchen_preparing" : "bar_preparing";
  const readyField     = isKitchen ? "kitchen_ready"     : "bar_ready";

  if (status === "PREPARING") {
    // Solo marca esta estación como en preparación; no toca la otra estación ni el status global.
    payload[preparingField] = true;
    payload.status = "PREPARING"; // el pedido global pasa a PREPARING si no lo estaba aún
    const { data, error } = await supabase.from("orders").update(payload).eq("id", orderId).select();
    return { data, error };
  }

  if (status === "READY") {
    payload[readyField]     = true;
    payload[preparingField] = false;

    // Consultamos el estado actual para decidir si el pedido global ya puede ser READY
    const { data: currentOrder } = await supabase
      .from("orders")
      .select("bar_ready, kitchen_ready, order_items(menu_items(category:categories(target_station)))")
      .eq("id", orderId)
      .single();

    if (currentOrder) {
      const items = currentOrder.order_items || [];
      const otherStation = isKitchen ? "BAR" : "KITCHEN";
      const hasOtherStationItems = items.some(
        (item: any) => item.menu_items?.category?.target_station === otherStation
      );
      const otherStationReady = isKitchen ? currentOrder.bar_ready : currentOrder.kitchen_ready;

      payload.status = (!hasOtherStationItems || otherStationReady) ? "READY" : "PREPARING";
    } else {
      payload.status = "READY";
    }

    const { data, error } = await supabase.from("orders").update(payload).eq("id", orderId).select();
    return { data, error };
  }

  // Cualquier otro estado (DELIVERED, COMPLETED, REJECTED): actualización directa
  payload.status = status;
  const { data, error } = await supabase.from("orders").update(payload).eq("id", orderId).select();
  return { data, error };
};

export const resetPasswordForEmail = async (email: string, redirectTo: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  return { data, error };
};

export const updateUserPassword = async (password: string) => {
  const { data, error } = await supabase.auth.updateUser({
    password,
  });
  return { data, error };
};

export * from "./types";

export const sendAlert = async (params: {
  restaurantId: string;
  userId?: string;
  userEmail?: string;
  type: AlertType;
  message: string;
  tableNumber?: number;
  menuItemId?: string;
  menuItemName?: string;
}) => {
  const payload = {
    restaurant_id:  params.restaurantId,
    user_id:        params.userId || null,
    user_email:     params.userEmail || null,
    type:           params.type,
    message:        params.message,
    status:         'PENDING',
    table_number:   params.tableNumber ?? null,
    menu_item_id:   params.menuItemId || null,
    menu_item_name: params.menuItemName || null,
  };

  const { error } = await supabase.from('alerts').insert(payload);
  
  if (error) {
    console.error('[sendAlert] Error de Supabase:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
  }

  return { error };
};

export const getRestaurantTheme = async (restaurantId: string) => {
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
    fontAccent: data.font_accent,
    logoUrl: data.logo_url,
  };
};

export * from "./hooks";
export * from "./utils";
export * from "./constants";
