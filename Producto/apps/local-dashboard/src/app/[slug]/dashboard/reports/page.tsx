"use client";

import React from "react";
import LocalShell from "../_components/LocalShell";
import { buildSpreadsheetML, downloadXML } from "../../../../lib/reportUtils";
import { useReportsData } from "../../../../hooks/useReportsData";

// Components
import ReportsToolbar from "./_components/ReportsToolbar";
import DailyPerformanceTable from "./_components/DailyPerformanceTable";
import TeamRankingTable from "./_components/TeamRankingTable";
import TopItemsTable from "./_components/TopItemsTable";
import TableOccupationTable from "./_components/TableOccupationTable";
import KitchenTimingHeatmap from "./_components/KitchenTimingHeatmap";

const PRESETS = [
  { label: "7D",   days: 7 },
  { label: "14D",  days: 14 },
  { label: "30D",  days: 30 },
  { label: "90D",  days: 90 },
  { label: "CUSTOM", days: 0 },
] as const;

/**
 * ReportsPage - Analítica y Reportes de Venta
 * 
 * Orquestador visual de métricas de rendimiento diario, ranking de equipo,
 * platos populares y ocupación de mesas.
 */
export default function ReportsPage() {
  const {
    dailyReports,
    topItems,
    tableReports,
    garzonReports,
    timingStats,
    loading,
    error,
    preset,
    isCustom,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    applyPreset,
    applyCustomRange,
  } = useReportsData();

  /**
   * Genera y descarga el reporte en formato Excel (SpreadsheetML)
   */
  function handleExport() {
    const periodLabel = isCustom
      ? `${dateFrom}_al_${dateTo}`
      : `ultimos_${preset}_dias`;

    const xml = buildSpreadsheetML(
      periodLabel,
      dailyReports,
      garzonReports,
      topItems,
      tableReports,
    );
    downloadXML(xml, `reporte_ventas_${periodLabel}.xls`);
  }

  const periodDescription = isCustom
    ? `${dateFrom} al ${dateTo}`
    : `Últimos ${preset} días`;

  return (
    <LocalShell title="Analítica" subtitle="Reportes de Venta">
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold mb-6">
          {error}
        </div>
      )}

      {/* Toolbar Modular de Filtros */}
      <ReportsToolbar
        presets={PRESETS}
        preset={preset}
        isCustom={isCustom}
        dateFrom={dateFrom}
        dateTo={dateTo}
        loading={loading}
        onPresetChange={applyPreset}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onApplyCustom={applyCustomRange}
        onExport={handleExport}
      />

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest">Calculando métricas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <DailyPerformanceTable reports={dailyReports} description={periodDescription} />
          <TeamRankingTable reports={garzonReports} />
          <TopItemsTable items={topItems} />
          <TableOccupationTable reports={tableReports} />
          <KitchenTimingHeatmap stats={timingStats} loading={loading} description={periodDescription} />
        </div>
      )}
    </LocalShell>
  );
}
