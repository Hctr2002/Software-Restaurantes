/**
 * Helpers de propina (paridad con packages/ui dashboardTypes del web).
 * La propina efectiva usa el monto fijo elegido por el cliente (tip_amount);
 * si no hay monto pero tip_included está activo, cae al 10% (flujo legacy/garzón).
 */

export const DEFAULT_TIP_RATE = 0.1;

export function effectiveTip(total: number, tipIncluded: boolean, tipAmount?: number | null): number {
  if (tipAmount && tipAmount > 0) return Math.round(tipAmount);
  return tipIncluded ? Math.round(total * DEFAULT_TIP_RATE) : 0;
}

export function tipPercent(total: number, tip: number): number {
  return total > 0 ? Math.round((tip / total) * 100) : 0;
}
