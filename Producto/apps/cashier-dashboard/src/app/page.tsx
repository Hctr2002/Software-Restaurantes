"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@menu-bites/store";
import {
  supabase,
  signOut,
  getSession,
  formatCLP,
  useCashierOrders,
  useTableStatus,
  useAlertForm
} from "@menu-bites/auth";
import {
  OrderCardSkeleton,
  OrderGroupCard,
  groupOrders,
  PaymentSlideOver,
  BillAlertIsland,
  type TableGroup
} from "@menu-bites/ui";
import { CheckCircle, History, Clock } from "lucide-react";

import { AlertModal } from "./_components/AlertModal";
import { CashierHeader } from "./_components/CashierHeader";

const AnimatedNumber = ({ value, formatFn }: { value: number; formatFn: (n: number) => string }) => (
  <motion.span key={value} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} transition={{ duration: 0.3 }} className="inline-block">
    {formatFn(value)}
  </motion.span>
);

export default function CashierPage() {
  const { user, setUser, logout: clearAuth } = useAuthStore();
  const { 
    orders, 
    history, 
    loading, 
    refetch,
  } = useCashierOrders(user?.restaurantId);

  // Estado local que indica que hay una operación de cobro en curso.
  // Bloquea el botón de confirmación en PaymentSlideOver para evitar doble envío.
  const [isPaying, setIsPaying] = useState(false);
  const { tables } = useTableStatus(user?.restaurantId);

  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [selectedGroup, setSelectedGroup] = useState<TableGroup | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [alertModal, setAlertModal] = useState(false);
  
  const alertForm = useAlertForm(user?.restaurantId, user?.id, user?.email);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Hydrate store when missing session
  useEffect(() => {
    if (user) return;
    getSession().then((session) => {
      if (!session) return;
      setUser({ id: session.user.id, email: session.user.email ?? "", role: session.user.app_metadata?.role, restaurantId: session.user.app_metadata?.restaurant_id });
    });
  }, [user, setUser]);

  const billRequestedTables = useMemo(() => 
    Object.fromEntries(tables.map((t) => [t.id, t.billRequested ?? false])), 
  [tables]);

  const tipIncludedTables = useMemo(() => 
    Object.fromEntries(tables.map((t) => [t.id, t.tip_included ?? false])), 
  [tables]);

  const groups = useMemo(() => ({
    pending: groupOrders(orders, billRequestedTables, tipIncludedTables),
    history: groupOrders(history, billRequestedTables, tipIncludedTables)
  }), [orders, history, billRequestedTables, tipIncludedTables]);

  const totals = useMemo(() => ({
    pending: groups.pending.reduce((s, g) => s + g.total, 0),
    history: groups.history.reduce((s, g) => s + g.total, 0)
  }), [groups]);

  const filtered = useMemo(() => {
    const current = activeTab === "pending" ? groups.pending : groups.history;
    return current.filter((g) =>
      g.tableNumber?.toString().includes(searchQuery) || g.key.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeTab, groups, searchQuery]);

  const handleMarkDelivered = async (group: TableGroup) => {
    setIsPaying(true);
    try {
      // Delegar el cierre de órdenes y actualización de mesa a la función
      // RPC completar_pago_mesa. Esta función ejecuta todo en una única
      // transacción atómica en la base de datos, eliminando el riesgo de
      // estados inconsistentes que existía con el bucle secuencial anterior.
      const orderIds = group.orders
        .filter((o) => o.status !== "COMPLETED" && o.status !== "REJECTED")
        .map((o) => o.id);

      if (orderIds.length > 0) {
        const { error } = await supabase.rpc("completar_pago_mesa", {
          p_order_ids: orderIds,
          p_table_id:  group.tableId ?? null,
        });
        if (error) throw error;
      }

      const receiptUrl = group.sessionId
        ? `/receipt/session/${group.sessionId}?rid=${user?.restaurantId}&tip=${group.tipIncluded}&ref=${encodeURIComponent(paymentReference)}`
        : `/receipt/table/${group.tableId}?rid=${user?.restaurantId}&tip=${group.tipIncluded}&ref=${encodeURIComponent(paymentReference)}`;

      window.open(receiptUrl, "_blank");
      setSelectedGroup(null);
      setPaymentReference("");
      refetch();
    } catch (err: any) {
      console.error("Error al procesar pago:", err?.message || JSON.stringify(err));
      alert(`Error al cobrar: ${err?.message || "Revisa la consola"}`);
    } finally {
      setIsPaying(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try { await signOut(); } finally { clearAuth(); window.location.href = process.env.NEXT_PUBLIC_AUTH_URL ?? "/"; }
  };


  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <div className="p-4 sm:p-6 pt-6 sm:pt-8 pb-0">
          <CashierHeader
            userEmail={user?.email}
            restaurantId={user?.restaurantId}
            isSigningOut={isSigningOut}
            isRefreshing={loading}
            totalPending={totals.pending}
            alertCount={groups.pending.filter((g) => g.billRequested).length}
            searchQuery={searchQuery}
            isSearchExpanded={isSearchExpanded}
            onSearchChange={setSearchQuery}
            onSearchToggle={() => setIsSearchExpanded((p) => !p)}
            onAlertClick={() => {
              setAlertModal(true);
            }}
            onRefresh={() => {
              refetch();
            }}
            onSignOut={handleSignOut}
          />
        </div>

        {/* Tabs & Stats */}
        <div className="px-4 sm:px-8 py-4 sm:py-6 bg-card/30 border-b border-border/5 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
          <div className="flex p-1.5 bg-card rounded-2xl border border-border/10 w-fit">
            {(["pending", "history"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"}`}>
                {tab === "pending" ? <Clock className="w-4 h-4" /> : <History className="w-4 h-4" />}
                {tab === "pending" ? "Pendientes" : "Historial"}
                {tab === "pending" && groups.pending.length > 0 && (
                  <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-[10px]">{groups.pending.length}</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 sm:gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Caja Pendiente</span>
              <span className="text-lg sm:text-xl font-black text-success"><AnimatedNumber value={totals.pending} formatFn={formatCLP} /></span>
            </div>
            <div className="h-10 w-px bg-white/5" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Cobrado hoy</span>
              <span className="text-lg sm:text-xl font-black text-foreground/80"><AnimatedNumber value={totals.history} formatFn={formatCLP} /></span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-8 relative">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => <OrderCardSkeleton key={i} />)}
              </motion.div>
            ) : filtered.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center justify-center py-32 gap-6 text-muted-foreground">
                <div className="w-24 h-24 bg-card rounded-[2.5rem] flex items-center justify-center border border-border/10">
                  {activeTab === "pending" ? <CheckCircle className="w-10 h-10 text-success/20" /> : <History className="w-10 h-10 text-muted-foreground/30" />}
                </div>
                <p className="text-sm font-bold tracking-tight">
                  {searchQuery ? "No se encontraron resultados" : activeTab === "pending" ? "No hay cuentas listas para cobro" : "Sin cobros hoy"}
                </p>
              </motion.div>
            ) : (
              <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: "easeOut" }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
                {filtered.map((group, index) => (
                  <OrderGroupCard
                    key={group.key}
                    group={group}
                    index={index}
                    isPending={activeTab === "pending"}
                    onClick={() => activeTab === "pending" && setSelectedGroup(group)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
 
          <BillAlertIsland 
            groups={groups.pending} 
            onSelect={async (group) => {
              setSelectedGroup(group);
              if (group.tableId) {
                await supabase
                  .from("tables")
                  .update({ bill_requested: false })
                  .eq("id", group.tableId);
              }
            }} 
          />
        </main>
 
        {selectedGroup && (
          <PaymentSlideOver group={selectedGroup} paymentReference={paymentReference} isProcessing={isPaying} onPaymentRefChange={setPaymentReference} onConfirm={() => handleMarkDelivered(selectedGroup)} onClose={() => setSelectedGroup(null)} />
        )}
 
        {alertModal && (
          <AlertModal 
            {...alertForm}
            onTableNumChange={alertForm.setTableNum}
            onMsgChange={alertForm.setAlertMsg}
            onSend={async () => {
              const success = await alertForm.handleSendAlert();
              if (success) {
                setAlertModal(false);
              }
            }}
            onClose={() => {
              setAlertModal(false);
              alertForm.reset();
            }} 
          />
        )}
      </div>
  );
}
