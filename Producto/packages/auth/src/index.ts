import { createBrowserClient } from '@supabase/ssr';
import { AlertType } from './types';

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

export const updateOrderStatus = async (orderId: string, status: string) => {
  const timestampField = STATUS_TIMESTAMP[status];
  const payload: Record<string, unknown> = { status };
  if (timestampField) payload[timestampField] = new Date().toISOString();

  const { data, error } = await supabase
    .from("orders")
    .update(payload)
    .eq("id", orderId)
    .select();
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
    logoUrl: data.logo_url,
  };
};

export * from "./hooks";
export * from "./utils";
export * from "./constants";
