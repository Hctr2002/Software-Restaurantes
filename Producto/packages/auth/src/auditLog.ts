/**
 * auditLog.ts — Registro de auditoría para acciones críticas del bar y otros módulos.
 * Los fallos de escritura en audit_logs son no-críticos: se registran en consola sin lanzar excepción.
 */

import { supabase } from './index';

export type BarAuditAction =
  | 'STOCK_MARKED_OUT'
  | 'STOCK_RESTORED'
  | 'SETTINGS_UPDATED'
  | 'ALERT_SENT';

/**
 * Registra una acción de auditoría en la tabla audit_logs.
 * @param restaurantId - UUID del restaurante afectado.
 * @param userId - UUID del usuario que ejecutó la acción (null si es proceso automático).
 * @param action - Tipo de acción: STOCK_MARKED_OUT, STOCK_RESTORED, SETTINGS_UPDATED, ALERT_SENT.
 * @param details - Datos adicionales contextuales de la acción.
 */
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
