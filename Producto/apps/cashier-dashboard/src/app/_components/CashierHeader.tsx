"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Receipt, LogOut, AlertTriangle, RefreshCw, Search, CreditCard, Bell } from "lucide-react";
import { formatCLP } from "@menu-bites/auth";

interface Props {
  userEmail: string | undefined;
  restaurantId: string | undefined;
  isSigningOut: boolean;
  isRefreshing: boolean;
  totalPending: number;
  alertCount: number;
  searchQuery: string;
  isSearchExpanded: boolean;
  onSearchChange: (q: string) => void;
  onSearchToggle: () => void;
  onAlertClick: () => void;
  onRefresh: () => void;
  onSignOut: () => void;
}

const AnimatedNumber = ({ value, formatFn }: { value: number; formatFn: (n: number) => string }) => (
  <motion.span key={value} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} transition={{ duration: 0.3 }} className="inline-block">
    {formatFn(value)}
  </motion.span>
);

import { PremiumHeader, HeaderStat } from "@menu-bites/ui";

export function CashierHeader({ userEmail, restaurantId, isSigningOut, isRefreshing, totalPending, alertCount, searchQuery, isSearchExpanded, onSearchChange, onSearchToggle, onAlertClick, onRefresh, onSignOut }: Props) {
  return (
    <PremiumHeader
      title="Terminal"
      accentTitle="Caja"
      icon={Receipt}
      statusSubLabel={`${restaurantId?.split("-")[0] || "RESTAURANTE"} · EN LÍNEA`}
      stats={
        <>
          <HeaderStat label="Caja Pendiente" value={formatCLP(totalPending)} color="text-emerald-400" />
          <HeaderStat label="Alertas Mesa" value={alertCount} color="text-foreground" />
        </>
      }
      actions={
        <div className="flex items-center gap-4">
          <div className="relative flex items-center h-12">
            <AnimatePresence>
              {isSearchExpanded && (
                <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 240, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="overflow-hidden mr-2">
                  <input type="text" placeholder="Buscar mesa o sesión..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-primary/50 transition-all" autoFocus />
                </motion.div>
              )}
            </AnimatePresence>
            <button onClick={onSearchToggle} className={`p-2.5 rounded-xl transition-all ${isSearchExpanded ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground hover:text-foreground"}`}>
              <Search className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center bg-white/5 rounded-2xl p-1 border border-white/5">
            <button onClick={onRefresh} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all active:scale-90" title="Actualizar">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
            <button onClick={onAlertClick} className="p-2 rounded-xl text-yellow-500 hover:bg-yellow-500/10 transition-all active:scale-90" title="Nueva Alerta">
              <AlertTriangle className="w-4 h-4" />
            </button>
            <button onClick={onSignOut} disabled={isSigningOut} className="p-2 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90" title="Salir">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          
          <div className="hidden xl:flex flex-col items-end">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Usuario</p>
            <p className="text-xs font-black text-foreground/80 leading-none">{userEmail}</p>
          </div>
        </div>
      }
    />
  );
}
