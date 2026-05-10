import { supabase } from './index';

export type BarAuditAction =
  | 'STOCK_MARKED_OUT'
  | 'STOCK_RESTORED'
  | 'SETTINGS_UPDATED'
  | 'ALERT_SENT';

export async function logBarAction(
  restaurantId: string,
  userId: string | undefined,
  action: BarAuditAction,
  details: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from('audit_logs').insert({
    restaurant_id: restaurantId,
    user_id: userId ?? null,
    action,
    details,
    created_at: new Date().toISOString(),
  });

  if (error) {
    // Audit logging is non-critical — log but don't throw
    console.warn('[auditLog] Error al registrar acción:', error.message);
  }
}
