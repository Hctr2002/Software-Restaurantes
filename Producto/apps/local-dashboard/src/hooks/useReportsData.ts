/**
 * useReportsData — Hook de analítica que carga y procesa órdenes históricas para el módulo de Reportes.
 * Soporta presets de período (7D, 14D, 30D, 90D) y rangos personalizados.
 */
"use client";

import { useState, useCallback, useEffect } from "react";
import { 
  processDailyReports, 
  processTopItems, 
  processTableReports, 
  processStaffReports,
  buildTimingStats, 
  daysAgoISO, 
  todayISO 
} from "../lib/reportUtils";

export type DayReport    = { date: string; orders: number; revenue: number; avg: number };
export type TopItem      = { name: string; count: number; revenue: number };
export type TableReport  = { number: number; orders: number; revenue: number };
export type GarzonReport = { email: string; orders: number; revenue: number };
export type TimingStats  = {
  category:       string;
  validationMin:  number;
  kitchenMin:     number;
  totalMin:       number;
  count:          number;
};

/**
 * Carga órdenes con estado DELIVERED o COMPLETED y las distribuye en cinco vistas:
 * rendimiento diario, top ítems, ocupación por mesa, ranking de garzones y tiempos de cocina.
 */
export function useReportsData() {
  const [dailyReports,  setDailyReports]  = useState<DayReport[]>([]);
  const [topItems,      setTopItems]      = useState<TopItem[]>([]);
  const [tableReports,  setTableReports]  = useState<TableReport[]>([]);
  const [garzonReports, setGarzonReports] = useState<GarzonReport[]>([]);
  const [timingStats,   setTimingStats]   = useState<TimingStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Estados de UI
  const [preset,   setPreset]   = useState<number>(7);
  const [dateFrom, setDateFrom] = useState(daysAgoISO(7));
  const [dateTo,   setDateTo]   = useState(todayISO());
  const [isCustom, setIsCustom] = useState(false);

  const fetchReports = useCallback(async (from: string, to: string) => {
    setLoading(true);
    setError(null);
    try {
      const fromISO = new Date(from + "T00:00:00").toISOString();
      const toISO   = new Date(to   + "T23:59:59").toISOString();

      const res = await fetch(
        `/api/local/orders?from=${fromISO}&to=${toISO}&status=ALL&limit=2000`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error cargando reportes");

      // Incluimos tanto DELIVERED como COMPLETED en los reportes
      const orders: any[] = (json.data || []).filter((o: any) => 
        o.status === "DELIVERED" || o.status === "COMPLETED"
      );

      // Procesamiento modularizado
      setDailyReports(processDailyReports(orders, from, to));
      setTopItems(processTopItems(orders));
      setTableReports(processTableReports(orders));
      setGarzonReports(processStaffReports(orders));
      setTimingStats(buildTimingStats(orders));

    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, []);

  const applyPreset = useCallback((days: number) => {
    if (days === 0) {
      setIsCustom(true);
      return;
    }
    setIsCustom(false);
    setPreset(days);
    const from = daysAgoISO(days);
    const to   = todayISO();
    setDateFrom(from);
    setDateTo(to);
    fetchReports(from, to);
  }, [fetchReports]);

  const applyCustomRange = useCallback(() => {
    if (!dateFrom || !dateTo || dateFrom > dateTo) return;
    fetchReports(dateFrom, dateTo);
  }, [dateFrom, dateTo, fetchReports]);

  // Inicialización
  useEffect(() => {
    if (!isCustom) {
      fetchReports(dateFrom, dateTo);
    }
  }, [fetchReports, dateFrom, dateTo, isCustom]);

  return {
    dailyReports,
    topItems,
    tableReports,
    garzonReports,
    timingStats,
    loading,
    error,
    preset,
    setPreset,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    isCustom,
    setIsCustom,
    applyPreset,
    applyCustomRange,
    fetchReports,
  };
}
