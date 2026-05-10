"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@menu-bites/store";
import { useTables, signOut, supabase } from "@menu-bites/auth";
import { RestaurantThemeProvider, CardSkeleton, Button, Badge, PremiumHeader } from "@menu-bites/ui";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, Bell, LogOut, AlertTriangle, UtensilsCrossed, Sparkles, ChevronDown, RefreshCw, Receipt, Link2 } from "lucide-react";

import { 
  PendingOrderCard, 
  ReadyOrdersBanner, 
  TableMergeBar, 
  AlertModal, 
  TableCard,
  PreparingOrdersList
} from "@menu-bites/ui";
import { useRealtimeWaiterOrders as useWaiterOrders, useAlertForm, useThemeSync } from "@menu-bites/auth";
import { useWebPush } from "../hooks/useWebPush";
import { useMergeTables } from "../hooks/useMergeTables";

export default function WaiterDashboard() {
  const router = useRouter();
  const { user, logout: clearAuth } = useAuthStore();
  const orders = useWaiterOrders(user?.restaurantId);
  const { 
    tables, 
    loading: waiterLoading, 
    handleTableClean,
    billRequestedTableIds,
    readyTableIds,
    preparingTableIds,
    cleaningTables
  } = orders;

  useWebPush(user?.restaurantId, orders.readyOrders);
  const merge = useMergeTables();
  const alertForm = useAlertForm(user?.restaurantId, user?.id, user?.email);
  const theme = useThemeSync(user?.restaurantId);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"mesas" | "pedidos">("mesas");

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      clearAuth();
      window.location.href = process.env.NEXT_PUBLIC_AUTH_URL ?? '/';
    }
  };

  if (waiterLoading) {
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

        <div className="p-4 lg:p-6 pb-0">
          <PremiumHeader
            title="Terminal"
            accentTitle="Garzón"
            icon={UtensilsCrossed}
            statusSubLabel={`${user?.restaurantId?.split("-")[0] || "RESTAURANTE"} · EN LÍNEA`}
            actions={
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-white/5 rounded-2xl p-1 border border-white/5">
                  <button onClick={() => setAlertModal(true)} className="p-2.5 rounded-xl text-yellow-500 hover:bg-yellow-500/10 transition-all active:scale-90" title="Nueva Alerta">
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                  <button onClick={handleSignOut} disabled={isSigningOut} className="p-2.5 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90" title="Salir">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
                <div className="hidden xl:flex flex-col items-end">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Usuario</p>
                  <p className="text-xs font-black text-foreground/80 leading-none">{user?.email}</p>
                </div>
              </div>
            }
          />
        </div>

        {/* Status Islands */}
        <div className="px-6 py-4 flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {(orders.readyOrders.length > 0 || orders.partiallyReadyOrders.length > 0) && (
              <motion.div layout initial={{ height: 80, opacity: 0, y: -20 }} animate={{ height: isIslandExpanded ? "auto" : 80, opacity: 1, y: 0 }} exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                className="relative overflow-hidden bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] p-4 flex flex-col">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                      <Sparkles className="w-6 h-6 text-emerald-400" />
                    </motion.div>
                    <div>
                      <h3 className="font-black text-sm text-emerald-400 uppercase tracking-widest leading-none mb-1.5">Aviso de Despacho</h3>
                      <p className="text-[10px] text-emerald-400/60 font-black uppercase tracking-widest">
                        {orders.readyOrders.length + orders.partiallyReadyOrders.length} Pedidos disponibles
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setIsIslandExpanded(!isIslandExpanded)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-emerald-400">
                    <motion.div animate={{ rotate: isIslandExpanded ? 180 : 0 }}><ChevronDown className="w-5 h-5" /></motion.div>
                  </button>
                </div>
                <AnimatePresence>
                  {isIslandExpanded && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="pt-6 w-full">
                      <ReadyOrdersBanner 
                        orders={[...orders.readyOrders, ...orders.partiallyReadyOrders]} 
                        onDeliver={orders.handleDeliver} 
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col md:flex-row gap-3">
            <AnimatePresence>
              {orders.helpRequestedTables?.length > 0 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 bg-red-500/10 border border-red-500/20 rounded-[2.5rem] p-5 flex items-center justify-between gap-4 shadow-lg shadow-red-500/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
                      <Bell className="w-5 h-5 text-red-400 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-black text-xs text-red-400 uppercase tracking-widest leading-none mb-1.5">Solicitud Ayuda</h3>
                      <p className="text-[10px] text-red-400/60 font-black uppercase tracking-widest">{orders.helpRequestedTables.length} Mesas esperando</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {orders.helpRequestedTables.slice(0, 2).map((t: any) => (
                      <button key={t.id} onClick={() => orders.handleHelpComplete(t.id)} className="bg-red-500/20 hover:bg-red-500/30 text-[10px] font-black text-white px-4 py-3 rounded-2xl border border-red-500/30 transition-all active:scale-95 shadow-xl shadow-red-500/20">
                        Mesa {t.number} ✓
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
              {tables.some((t) => t.billRequested) && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex-1 bg-yellow-500/10 border border-yellow-500/20 rounded-[2.5rem] p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                    <Receipt className="w-5 h-5 text-yellow-400 animate-bounce-slow" />
                  </div>
                  <div>
                    <h3 className="font-black text-xs text-yellow-400 uppercase tracking-widest leading-none mb-1.5">Cuentas</h3>
                    <p className="text-[10px] text-yellow-400/60 font-black uppercase tracking-widest">{tables.filter((t) => t.billRequested).length} Por cobrar</p>
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
                      isPreparing={preparingTableIds.has(table.id)}
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
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-4xl font-black tracking-tighter">Gestión de <span className="text-primary">Pedidos</span></h2>
                    <p className="text-muted-foreground text-xs font-black uppercase tracking-widest opacity-60 mt-1">Validación y seguimiento de cocina</p>
                  </div>
                </div>

                {orders.pendingOrders.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-yellow-500/80 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                      Por Validar ({orders.pendingOrders.length})
                    </h3>
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
                              onValidate={(order) => orders.handleValidate(order.id, orders.notesByOrder[order.id])}
                              onReject={(order) => orders.handleReject(order.id, order.tableId)}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* En Cocina (Unified Component) */}
                <PreparingOrdersList orders={orders.preparingOrders} />

                {orders.pendingOrders.length === 0 && orders.preparingOrders.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-32 gap-6 text-muted-foreground border-2 border-dashed border-white/5 rounded-[3rem]">
                    <p className="text-sm font-black uppercase tracking-widest opacity-40">Todo está al día</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {alertModal && (
          <AlertModal 
            {...alertForm} 
            onSend={alertForm.handleSendAlert} 
            onClose={() => {
              setAlertModal(false);
              alertForm.reset();
            }} 
          />
        )}
      </AnimatePresence>
    </RestaurantThemeProvider>
  );
}
