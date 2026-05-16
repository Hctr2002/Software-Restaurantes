"use client";

import { 
  RestaurantThemeProvider, 
  CardSkeleton, 
  PremiumHeader,
  PendingOrderCard, 
  ReadyOrdersBanner, 
  TableMergeBar, 
  AlertModal, 
  TableCard,
  PreparingOrdersList,
  TableOrdersModal
} from "@menu-bites/ui";
import { AnimatePresence, motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Bell, 
  LogOut, 
  AlertTriangle, 
  UtensilsCrossed, 
  Sparkles, 
  ChevronDown, 
  RefreshCw, 
  Receipt, 
  Link2, 
  Link2Off 
} from "lucide-react";

import { useWaiterDashboard } from "../hooks/useWaiterDashboard";

export default function WaiterDashboard() {
  const {
    router,
    user,
    orders,
    tables,
    waiterLoading,
    handleTableClean,
    billRequestedTableIds,
    readyTableIds,
    preparingTableIds,
    cleaningTables,
    merge,
    alertForm,
    theme,
    isSigningOut,
    alertModal,
    setAlertModal,
    isIslandExpanded,
    setIsIslandExpanded,
    activeTab,
    setActiveTab,
    selectedTableId,
    setSelectedTableId,
    selectedTable,
    handleSignOut
  } = useWaiterDashboard();

  if (waiterLoading) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-8">
        <header className="flex justify-between items-center py-4">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-muted/30 animate-pulse rounded-2xl" />
            <div className="space-y-2">
              <div className="w-24 h-4 bg-muted/30 animate-pulse rounded" />
              <div className="w-32 h-2 bg-muted/30 animate-pulse rounded" />
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
    <RestaurantThemeProvider theme={theme}>
      <div className="min-h-screen bg-background text-foreground pb-32 font-sans flex flex-col relative overflow-x-hidden">
        
        <div className="p-4 lg:p-6 pb-0">
          <PremiumHeader
            title="Terminal"
            accentTitle="Garzón"
            icon={UtensilsCrossed}
            statusSubLabel={`${user?.restaurantId?.split("-")[0] || "RESTAURANTE"} · EN LÍNEA`}
            actions={
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-card rounded-[2rem] p-1.5 border border-border shadow-xl">
                  <button onClick={() => setAlertModal(true)} className="p-3 rounded-2xl text-warning hover:bg-warning/10 transition-all active:scale-90" title="Nueva Alerta">
                    <AlertTriangle className="w-5 h-5" />
                  </button>
                  <button onClick={handleSignOut} disabled={isSigningOut} className="p-3 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all active:scale-90" title="Salir">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
                <div className="hidden xl:flex flex-col items-end">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1.5">Usuario</p>
                  <p className="text-xs font-black text-foreground/80 leading-none">{user?.email}</p>
                </div>
              </div>
            }
          />
        </div>

        {/* Status Islands: Premium Minimalist */}
        <div className="px-4 sm:px-6 py-4 flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {(orders.readyOrders.length > 0 || orders.partiallyReadyOrders.length > 0) && (
              <motion.div layout initial={{ height: 88, opacity: 0, y: -20 }} animate={{ height: isIslandExpanded ? "auto" : 88, opacity: 1, y: 0 }} exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                className="relative overflow-hidden bg-emerald-500/5 border border-emerald-500/10 rounded-[2.5rem] p-5 flex flex-col shadow-xl shadow-emerald-500/5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-5">
                    <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 3 }} className="w-12 h-12 rounded-[1.25rem] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Sparkles className="w-6 h-6 text-emerald-500" />
                    </motion.div>
                    <div>
                      <h3 className="font-black text-sm text-emerald-600 uppercase tracking-widest leading-none mb-1.5">Aviso de Despacho</h3>
                      <p className="text-[10px] text-emerald-600/70 font-black uppercase tracking-widest">
                        {orders.readyOrders.length + orders.partiallyReadyOrders.length} Pedidos disponibles
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setIsIslandExpanded(!isIslandExpanded)} className="p-3 bg-emerald-500/10 rounded-[1.25rem] hover:bg-emerald-500/20 transition-all text-emerald-600 border border-emerald-500/10">
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

          <div className="flex flex-col md:flex-row gap-4">
            <AnimatePresence>
              {orders.helpRequestedTables?.length > 0 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 bg-destructive/5 border border-destructive/20 rounded-[2.5rem] p-5 flex items-center justify-between gap-4 shadow-xl shadow-destructive/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-destructive/10 flex items-center justify-center border border-destructive/20">
                      <Bell className="w-6 h-6 text-destructive animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-black text-xs text-destructive uppercase tracking-widest leading-none mb-1.5">Solicitud Ayuda</h3>
                      <p className="text-[10px] text-destructive/70 font-black uppercase tracking-widest">{orders.helpRequestedTables.length} Mesas esperando</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {orders.helpRequestedTables.slice(0, 2).map((t: any) => (
                      <button key={t.id} onClick={() => orders.handleHelpComplete(t.id)} className="bg-destructive text-white text-[10px] font-black px-5 py-3 rounded-2xl shadow-lg shadow-destructive/20 transition-all hover:bg-destructive/90 active:scale-95">
                        Mesa {t.number} ✓
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {cleaningTables.length > 0 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 bg-primary/5 border border-primary/20 rounded-[2.5rem] p-5 flex items-center justify-between gap-4 shadow-xl shadow-primary/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-primary/10 flex items-center justify-center border border-primary/20">
                      <RefreshCw className="w-6 h-6 text-primary animate-spin-slow" />
                    </div>
                    <div>
                      <h3 className="font-black text-xs text-primary uppercase tracking-widest leading-none mb-1.5">Limpieza</h3>
                      <p className="text-[10px] text-primary/70 font-black uppercase tracking-widest">{cleaningTables.length} Mesas pendientes</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {cleaningTables.slice(0, 2).map((t) => (
                      <button key={t.id} onClick={() => handleTableClean(t.id)} className="bg-primary text-white text-[10px] font-black px-5 py-3 rounded-2xl shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95">
                        Mesa {t.number} ✓
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {tables.some((t) => t.billRequested) && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex-1 bg-amber-500/5 border border-amber-500/20 rounded-[2.5rem] p-5 flex items-center gap-5 shadow-xl shadow-amber-500/5">
                  <div className="w-12 h-12 rounded-[1.25rem] bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <Receipt className="w-6 h-6 text-amber-600 animate-bounce-slow" />
                  </div>
                  <div>
                    <h3 className="font-black text-xs text-amber-600 uppercase tracking-widest leading-none mb-1.5">Cuentas</h3>
                    <p className="text-[10px] text-amber-600/70 font-black uppercase tracking-widest">{tables.filter((t) => t.billRequested).length} Por cobrar</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Tabs: Premium Minimalist */}
        <div className="px-4 sm:px-6 py-2">
          <div className="flex p-2 bg-card rounded-[2.5rem] border border-border w-fit gap-2 shadow-2xl">
            {(["mesas", "pedidos"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`relative flex items-center gap-3 px-6 sm:px-10 py-3.5 sm:py-4 rounded-[1.75rem] text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab ? "bg-primary text-primary-foreground shadow-2xl shadow-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}>
                {tab === "mesas" ? <LayoutDashboard className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                {tab === "mesas" ? "Mesas" : "Pedidos"}
                {tab === "pedidos" && orders.pendingOrders.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center bg-destructive text-destructive-foreground rounded-full text-[10px] font-black border-2 border-card shadow-lg">
                    {orders.pendingOrders.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido Principal */}
        <main className="flex-1 px-4 sm:px-6 py-8">
          <AnimatePresence mode="wait">
            {activeTab === "mesas" ? (
              <motion.div key="mesas" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tighter">Gestión de <span className="text-primary">Salón</span></h2>
                    <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-60 mt-2 italic">
                      {merge.mergeMode ? "Selecciona mesas para fusionar" : "Selecciona una mesa para gestionar"}
                    </p>
                  </div>
                  <button 
                    onClick={merge.toggleMode} 
                    className={`relative flex items-center justify-center gap-3 px-8 py-4.5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all overflow-hidden group ${
                      merge.mergeMode 
                        ? "bg-destructive text-white shadow-2xl shadow-destructive/30 hover:bg-destructive/90" 
                        : "bg-primary text-primary-foreground shadow-2xl shadow-primary/30 hover:bg-primary/90"
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    {merge.mergeMode ? <Link2Off className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
                    <span className="hidden sm:block">{merge.mergeMode ? "Cancelar Fusión" : "Fusionar Mesas"}</span>
                  </button>
                </div>
                <TableMergeBar 
                  mergeMode={merge.mergeMode} 
                  selectedCount={merge.selectedForMerge.size} 
                  merging={merge.merging} 
                  mergeResult={merge.mergeResult} 
                  onToggleMode={merge.toggleMode} 
                  onConfirmMerge={merge.handleMergeTables} 
                  onConfirmUnlink={() => {
                    const selectedId = Array.from(merge.selectedForMerge)[0];
                    const table = tables.find(t => t.id === selectedId);
                    if (table?.current_session_id) {
                      merge.handleUnlinkTables(table.current_session_id);
                    }
                  }}
                  canUnlink={(() => {
                    const selectedId = Array.from(merge.selectedForMerge)[0];
                    const table = tables.find(t => t.id === selectedId);
                    return !!table?.current_session_id;
                  })()}
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
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
                      orders={orders.orders}
                      onNavigate={(id) => {
                        if (table.status === 'OCCUPIED' || table.status === 'RESERVED') {
                          setSelectedTableId(id);
                        } else {
                          router.push(`/tables/${id}/menu`);
                        }
                      }}
                      mergedTableNumbers={
                        table.current_session_id 
                          ? tables.filter(t => t.current_session_id === table.current_session_id).map(t => t.number)
                          : undefined
                      }
                    />
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="pedidos" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tighter">Gestión de <span className="text-primary">Pedidos</span></h2>
                    <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-60 mt-2 italic">Validación y seguimiento</p>
                  </div>
                </div>
                {orders.pendingOrders.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-amber-500/80 flex items-center gap-3 px-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                      Por Validar ({orders.pendingOrders.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <AnimatePresence mode="popLayout">
                        {orders.pendingOrders.map((order) => (
                          <motion.div key={order.id} layout initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                            <PendingOrderCard
                              order={order}
                              note={orders.notesByOrder[order.id] ?? ""}
                              barNote={order.barSubOrderId ? (orders.notesByOrder[order.barSubOrderId] ?? "") : undefined}
                              processingId={orders.processingId}
                              savingNoteId={orders.savingNoteId}
                              onNoteChange={(id, val) => orders.setNotesByOrder((p) => ({ ...p, [id]: val }))}
                              onSaveNote={orders.handleSaveNote}
                              onBarNoteChange={(id, val) => orders.setNotesByOrder((p) => ({ ...p, [id]: val }))}
                              onSaveBarNote={orders.handleSaveBarNote}
                              onValidate={(order) => orders.handleValidate(
                                order.id,
                                orders.notesByOrder[order.id],
                                order.barSubOrderId,
                                order.barSubOrderId ? orders.notesByOrder[order.barSubOrderId] : undefined
                              )}
                              onReject={(order) => orders.handleReject(order.id, order.tableId)}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                <PreparingOrdersList orders={orders.preparingOrders} />

                {orders.pendingOrders.length === 0 && orders.preparingOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-40 gap-6 text-muted-foreground border-2 border-dashed border-border rounded-[3rem]">
                    <p className="text-xs font-black uppercase tracking-[0.4em] opacity-30">Todo está al día</p>
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
        {selectedTableId && (
          <TableOrdersModal
            isOpen={!!selectedTableId}
            onClose={() => setSelectedTableId(null)}
            table={selectedTable}
            orders={orders.orders}
            onTakeOrder={(id) => router.push(`/tables/${id}/menu`)}
          />
        )}
      </AnimatePresence>
    </RestaurantThemeProvider>
  );
}
