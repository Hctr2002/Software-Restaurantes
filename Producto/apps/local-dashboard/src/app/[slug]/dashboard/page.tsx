"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, AlertTriangle } from "lucide-react";
import { useLocalDashboard } from "../../../hooks/useLocalDashboard";

import LocalShell from "./_components/LocalShell";
import { 
  KpiGrid, 
  LiveFlowMonitor, 
  OrderActivityFeed, 
  TableStatusBoard,
  StaleOrdersAlert
} from "@menu-bites/ui";

export default function DashboardPage() {
  const { 
    orders, 
    stats, 
    tables, 
    loading, 
    activeOrdersCount, 
    staleMinutes 
  } = useLocalDashboard();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <LocalShell title="Panel Local" subtitle="Resumen">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* KPI Section */}
        <KpiGrid stats={stats} activeOrdersCount={activeOrdersCount} />

        {/* Stale Orders Alerts (Unified Component) */}
        <StaleOrdersAlert orders={orders} staleMinutes={staleMinutes} />

        {/* Live Flow & Metrics */}
        <LiveFlowMonitor orders={orders} />

        {/* Activity & Tables Grid */}
        <OrderActivityFeed orders={orders} topItems={stats?.top_items ?? []} />

        {/* Table Board */}
        <TableStatusBoard tables={tables} />

        {loading && (
          <div className="flex items-center gap-3 mt-8 text-primary font-bold uppercase tracking-widest text-[10px]">
            <Activity className="w-4 h-4 animate-pulse" />
            Sincronizando local en tiempo real...
          </div>
        )}
      </motion.div>
    </LocalShell>
  );
}
