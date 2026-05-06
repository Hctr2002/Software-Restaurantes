"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@menu-bites/store";
import { useTables, signOut, supabase } from "@menu-bites/auth";
import { RestaurantThemeProvider, CardSkeleton, Button, Badge } from "@menu-bites/ui";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, Bell, LogOut, AlertTriangle, UtensilsCrossed, Sparkles, ChevronDown, RefreshCw, Receipt, Link2 } from "lucide-react";

import { PendingOrderCard } from "./_components/PendingOrderCard";
import { ReadyOrdersBanner } from "./_components/ReadyOrdersBanner";
import { TableMergeBar } from "./_components/TableMergeBar";
import { AlertModal } from "./_components/AlertModal";
import { TableCard } from "./_components/TableCard";
import { useWaiterOrders } from "../hooks/useWaiterOrders";
import { useWebPush } from "../hooks/useWebPush";
import { useThemeSync } from "../hooks/useThemeSync";
import { useMergeTables } from "../hooks/useMergeTables";
import { useAlertForm } from "../hooks/useAlertForm";

export default function WaiterDashboard() {
  const { user, logout: clearAuth } = useAuthStore();
  const { tables, loading: tablesLoading } = useTables(user?.restaurantId);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"mesas" | "pedidos">("mesas");
  const [alertModal, setAlertModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);

  const theme = useThemeSync(user?.restaurantId, "waiter");
  const orders = useWaiterOrders(user?.restaurantId);
  useWebPush(user?.restaurantId, orders.readyOrders);
  const merge = useMergeTables();
  const alertForm = useAlertForm(user?.restaurantId, user?.id, user?.email);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try { await signOut(); } finally {
      clearAuth();
      window.location.href = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000";
    }
  };

  const handleTableClean = async (tableId: string) => {
    await supabase.from("tables").update({ status: "FREE" }).eq("id", tableId);
  };

  const billRequestedTableIds = new Set(tables.filter((t) => t.bill_requested).map((t) => t.id));
  const readyTableIds = new Set(orders.readyOrders.map((o) => o.table_id).filter(Boolean));
  const cleaningTables = tables.filter((t) => t.status === "CLEANING");

  if (tablesLoading) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-8">
        <header className="flex justify-between items-center py-4">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-foreground/5 animate-pulse rounded-2xl" />
            <div className="space-y-2">
              <div className="w-24 h-4 bg-foreground/5 animate-pulse rounded" />
              <div className="w-32 h-2 bg-foreground/5 animate-pulse rounded" />
            </div>
          </div>
        </header>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {[...Array(12)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <RestaurantThemeProvider theme={theme ?? undefined} isGlobal>
      <div className="min-h-screen bg-background text-foreground pb-32 font-sans flex flex-col">

        {/* Header */}
        <header className="border-b border-border/10 px-6 py-5 flex items-center justify-between bg-card/40 backdrop-blur-2xl sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />
              <div className="relative w-10 h-10 bg-card border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
                <UtensilsCrossed className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter leading-none">
                Terminal <span className="text-primary">Garzón</span>
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-60">
                  {user?.restaurantId?.split("-")[0] || "RESTAURANTE"} · EN LÍNEA
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs font-bold text-foreground/80 hidden sm:block mr-2">{user?.email}</p>
            <div className="flex items-center bg-white/5 rounded-2xl p-1 border border-white/5">
              <button onClick={() => setAlertModal(true)} className="p-2.5 rounded-xl text-yellow-500 hover:bg-yellow-500/10 transition-all active:scale-90" title="Nueva Alerta">
                <AlertTriangle className="w-4 h-4" />
              </button>
              <button onClick={handleSignOut} disabled={isSigningOut} className="p-2.5 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90" title="Salir">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Status Islands */}
        <div className="px-6 py-4 flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {orders.readyOrders.length > 0 && (
              <motion.div layout initial={{ height: 80, opacity: 0, y: -20 }} animate={{ height: isIslandExpanded ? "auto" : 80, opacity: 1, y: 0 }} exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                className="relative overflow-hidden bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] p-4 flex flex-col">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                      <Sparkles className="w-6 h-6 text-emerald-400" />
                    </motion.div>
                    <div>
                      <h3 className="font-black text-sm text-emerald-400 uppercase tracking-widest leading-none mb-1.5">Cocina Despachando</h3>
                      <p className="text-[10px] text-emerald-400/60 font-black uppercase tracking-widest">{orders.readyOrders.length} {orders.readyOrders.length === 1 ? "Plato listo" : "Platos listos"}</p>
                    </div>
                  </div>
                  <button onClick={() => setIsIslandExpanded(!isIslandExpanded)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-emerald-400">
                    <motion.div animate={{ rotate: isIslandExpanded ? 180 : 0 }}><ChevronDown className="w-5 h-5" /></motion.div>
                  </button>
                </div>
                <AnimatePresence>
                  {isIslandExpanded && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <ReadyOrdersBanner orders={orders.readyOrders} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col md:flex-row gap-3">
            <AnimatePresence>
              {cleaningTables.length > 0 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 bg-sky-500/10 border border-sky-500/20 rounded-[2.5rem] p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/20 flex items-center justify-center border border-sky-500/30">
                      <RefreshCw className="w-5 h-5 text-sky-400 animate-spin-slow" />
                    </div>
                    <div>
                      <h3 className="font-black text-xs text-sky-400 uppercase tracking-widest leading-none mb-1.5">Limpieza</h3>
                      <p className="text-[10px] text-sky-400/60 font-black uppercase tracking-widest">{cleaningTables.length} Mesas pendientes</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {cleaningTables.slice(0, 2).map((t) => (
                      <button key={t.id} onClick={() => handleTableClean(t.id)} className="bg-sky-500/20 hover:bg-sky-500/30 text-[10px] font-black text-white px-4 py-3 rounded-2xl border border-sky-500/30 transition-all active:scale-95">
                        Mesa {t.number} ✓
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {tables.some((t) => t.bill_requested) && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex-1 bg-yellow-500/10 border border-yellow-500/20 rounded-[2.5rem] p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                    <Receipt className="w-5 h-5 text-yellow-400 animate-bounce-slow" />
                  </div>
                  <div>
                    <h3 className="font-black text-xs text-yellow-400 uppercase tracking-widest leading-none mb-1.5">Cuentas</h3>
                    <p className="text-[10px] text-yellow-400/60 font-black uppercase tracking-widest">{tables.filter((t) => t.bill_requested).length} Por cobrar</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-2">
          <div className="flex p-1.5 bg-card/60 backdrop-blur-md rounded-[1.5rem] border border-white/5 w-fit gap-2">
            {(["mesas", "pedidos"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`relative flex items-center gap-2 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}>
                {tab === "mesas" ? <LayoutDashboard className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                {tab === "mesas" ? "Mesas" : "Pedidos"}
                {tab === "pedidos" && orders.pendingOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center bg-red-500 text-white rounded-full text-[9px] font-black border-2 border-card">
                    {orders.pendingOrders.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 px-6 py-8">
          <AnimatePresence mode="wait">
            {activeTab === "mesas" ? (
              <motion.div key="mesas" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-4xl font-black tracking-tighter">Gestión de <span className="text-primary">Salón</span></h2>
                    <p className="text-muted-foreground text-xs font-black uppercase tracking-widest opacity-60 mt-1">
                      {merge.mergeMode ? "Selecciona 2+ mesas OCCUPIED para fusionar" : "Selecciona una mesa para tomar comandas"}
                    </p>
                  </div>
                  <Button variant="outline" size="icon" onClick={merge.toggleMode} className={`rounded-xl w-11 h-11 shrink-0 transition-all ${merge.mergeMode ? "border-primary/40 text-primary bg-primary/10" : "border-border/20"}`}>
                    <Link2 className="w-4 h-4" />
                  </Button>
                </div>
                <TableMergeBar mergeMode={merge.mergeMode} selectedCount={merge.selectedForMerge.size} merging={merge.merging} mergeResult={merge.mergeResult} onToggleMode={merge.toggleMode} onConfirmMerge={merge.handleMergeTables} />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {tables.map((table) => (
                    <TableCard
                      key={table.id}
                      table={table}
                      isBillRequested={billRequestedTableIds.has(table.id)}
                      isReady={readyTableIds.has(table.id)}
                      mergeMode={merge.mergeMode}
                      isSelectedForMerge={merge.selectedForMerge.has(table.id)}
                      onSelect={merge.toggleMergeSelect}
                      onNavigate={(id) => router.push(`/tables/${id}/menu`)}
                    />
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="pedidos" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                <div>
                  <h2 className="text-4xl font-black tracking-tighter">Pedidos <span className="text-primary">Pendientes</span></h2>
                  <p className="text-muted-foreground text-xs font-black uppercase tracking-widest opacity-60 mt-1">Validación y notas de cocina</p>
                </div>
                {orders.pendingOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 gap-6 text-muted-foreground border-2 border-dashed border-white/5 rounded-[3rem]">
                    <p className="text-sm font-black uppercase tracking-widest opacity-40">Todo está al día</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                      {orders.pendingOrders.map((order) => (
                        <motion.div key={order.id} layout initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                          <PendingOrderCard
                            order={order}
                            note={orders.notesByOrder[order.id] ?? ""}
                            processingId={orders.processingId}
                            savingNoteId={orders.savingNoteId}
                            onNoteChange={(id, val) => orders.setNotesByOrder((p) => ({ ...p, [id]: val }))}
                            onSaveNote={orders.handleSaveNote}
                            onValidate={orders.handleValidate}
                            onReject={orders.handleReject}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {alertModal && <AlertModal alertForm={alertForm} onClose={() => setAlertModal(false)} />}
      </AnimatePresence>
    </RestaurantThemeProvider>
  );
}
