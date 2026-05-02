import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// createBrowserClient from @supabase/ssr automatically manages session cookies
// so the Next.js middleware can detect the active session and redirect correctly.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

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

export const updateOrderStatus = async (orderId: string, status: string) => {
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
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

export type AlertType = 'TABLE_ISSUE' | 'BILL_REQUEST' | 'STOCK_SHORTAGE' | 'HELP_REQUEST' | 'GENERAL';

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
  const { error } = await supabase.from('alerts').insert({
    restaurant_id:  params.restaurantId,
    user_id:        params.userId        ?? null,
    user_email:     params.userEmail     ?? null,
    type:           params.type,
    message:        params.message,
    table_number:   params.tableNumber   ?? null,
    menu_item_id:   params.menuItemId    ?? null,
    menu_item_name: params.menuItemName  ?? null,
  });
  return { error };
};

export * from "./hooks";
