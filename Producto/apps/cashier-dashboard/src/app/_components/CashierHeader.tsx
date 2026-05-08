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

export function CashierHeader({ userEmail, restaurantId, isSigningOut, isRefreshing, totalPending, alertCount, searchQuery, isSearchExpanded, onSearchChange, onSearchToggle, onAlertClick, onRefresh, onSignOut }: Props) {
  return (
    <header className="border-b border-border/10 px-8 py-5 flex items-center justify-between bg-card/40 backdrop-blur-2xl sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />
          <div className="relative w-12 h-12 bg-card border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
            <Receipt className="w-6 h-6 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tighter leading-none">Terminal <span className="text-primary">Caja</span></h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-70">
              {restaurantId?.split("-")[0] || "RESTAURANTE"} · LIVE
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-4">
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

        <div className="bg-white/5 border border-white/5 rounded-2xl px-5 py-2.5 backdrop-blur-md flex items-center gap-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Caja Pendiente</p>
            <div className="text-sm font-black text-emerald-400 leading-none">
              <AnimatedNumber value={totalPending} formatFn={formatCLP} />
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-2xl px-5 py-2.5 backdrop-blur-md flex items-center gap-4">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Alertas Mesa</p>
            <div className="text-sm font-black text-foreground leading-none">
              <AnimatedNumber value={alertCount} formatFn={(n) => n.toString()} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <p className="text-xs font-bold text-foreground/80 hidden xl:block mr-2">{userEmail}</p>
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
      </div>
    </header>
  );
}
