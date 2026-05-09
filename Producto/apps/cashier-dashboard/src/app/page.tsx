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
  useThemeSync,
  useAlertForm
} from "@menu-bites/auth";
import { 
  RestaurantThemeProvider, 
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
    markDelivered, 
    isProcessing 
  } = useCashierOrders(user?.restaurantId);
  const { tables } = useTableStatus(user?.restaurantId);
  const theme = useThemeSync(user?.restaurantId, "cashier");

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
    try {
      for (const order of group.orders) {
        if (order.status === "DELIVERED" || order.status === "COMPLETED") continue;
        
        let currentStatus = order.status;
        
        if (currentStatus === "PENDING") {
          await supabase.from("orders").update({ status: "VALIDATED" }).eq("id", order.id);
          currentStatus = "VALIDATED";
        }
        if (currentStatus === "VALIDATED") {
          await supabase.from("orders").update({ status: "PREPARING" }).eq("id", order.id);
          currentStatus = "PREPARING";
        }
        if (currentStatus === "PREPARING") {
          await supabase.from("orders").update({ status: "READY" }).eq("id", order.id);
          currentStatus = "READY";
        }
        if (currentStatus === "READY") {
          await supabase.from("orders").update({ status: "COMPLETED" }).eq("id", order.id);
        }
      }
      
      if (group.tableId) {
        await supabase
          .from("tables")
          .update({ status: "CLEANING", bill_requested: false })
          .eq("id", group.tableId);
      }
      
      const receiptUrl = group.sessionId ? `/receipt/session/${group.sessionId}?rid=${user?.restaurantId}&tip=${group.tipIncluded}` : `/receipt/table/${group.tableId}?rid=${user?.restaurantId}&tip=${group.tipIncluded}`;
      window.open(receiptUrl, "_blank");
      setSelectedGroup(null);
      setPaymentReference("");
      refetch();
    } catch (err: any) {
      console.error("Error al procesar pago:", err?.message || JSON.stringify(err));
      alert(`Error al cobrar: ${err?.message || "Revisa la consola"}`);
    }
  };
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try { await signOut(); } finally { clearAuth(); window.location.href = process.env.NEXT_PUBLIC_AUTH_URL ?? "/"; }
  };


  return (
    <RestaurantThemeProvider theme={theme ?? undefined} isGlobal>
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
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

        {/* Tabs & Stats */}
        <div className="px-8 py-6 bg-card/30 border-b border-border/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex p-1.5 bg-card rounded-2xl border border-border/10 w-fit">
            {(["pending", "history"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? (tab === "pending" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-secondary text-secondary-foreground shadow-lg") : "text-muted-foreground hover:text-foreground"}`}>
                {tab === "pending" ? <Clock className="w-4 h-4" /> : <History className="w-4 h-4" />}
                {tab === "pending" ? "Pendientes" : "Historial"}
                {tab === "pending" && groups.pending.length > 0 && (
                  <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-[10px]">{groups.pending.length}</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Caja Pendiente</span>
              <span className="text-xl font-black text-emerald-400"><AnimatedNumber value={totals.pending} formatFn={formatCLP} /></span>
            </div>
            <div className="h-10 w-px bg-white/5" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Cobrado hoy</span>
              <span className="text-xl font-black text-foreground/80"><AnimatedNumber value={totals.history} formatFn={formatCLP} /></span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-8 relative">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => <OrderCardSkeleton key={i} />)}
              </motion.div>
            ) : filtered.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center justify-center py-32 gap-6 text-muted-foreground">
                <div className="w-24 h-24 bg-card rounded-[2.5rem] flex items-center justify-center border border-border/10">
                  {activeTab === "pending" ? <CheckCircle className="w-10 h-10 text-emerald-500/20" /> : <History className="w-10 h-10 text-slate-700" />}
                </div>
                <p className="text-sm font-bold tracking-tight">
                  {searchQuery ? "No se encontraron resultados" : activeTab === "pending" ? "No hay cuentas listas para cobro" : "Sin cobros hoy"}
                </p>
              </motion.div>
            ) : (
              <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: "easeOut" }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
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
 
          <BillAlertIsland groups={groups.pending} onSelect={setSelectedGroup} />
        </main>
 
        {selectedGroup && (
          <PaymentSlideOver group={selectedGroup} paymentReference={paymentReference} isProcessing={isProcessing} onPaymentRefChange={setPaymentReference} onConfirm={() => handleMarkDelivered(selectedGroup)} onClose={() => setSelectedGroup(null)} />
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
    </RestaurantThemeProvider>
  );
}
