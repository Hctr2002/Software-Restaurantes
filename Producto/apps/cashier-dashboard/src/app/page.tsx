"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@menu-bites/store";
import { supabase, signOut, getSession, formatCLP } from "@menu-bites/auth";
import { RestaurantThemeProvider, OrderCardSkeleton } from "@menu-bites/ui";
import { CheckCircle, History, Clock } from "lucide-react";

import { AlertModal } from "./_components/AlertModal";
import { OrderGroupCard, groupOrders, type Order, type TableGroup } from "./_components/OrderGroupCard";
import { PaymentSlideOver } from "./_components/PaymentSlideOver";
import { CashierHeader } from "./_components/CashierHeader";
import { BillAlertIsland } from "./_components/BillAlertIsland";
import { useCashierOrders } from "../hooks/useCashierOrders";
import { useThemeSync } from "../hooks/useThemeSync";

const AnimatedNumber = ({ value, formatFn }: { value: number; formatFn: (n: number) => string }) => (
  <motion.span key={value} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} transition={{ duration: 0.3 }} className="inline-block">
    {formatFn(value)}
  </motion.span>
);

export default function CashierPage() {
  const { user, setUser, logout: clearAuth } = useAuthStore();
  const { orders, history, loading, fetchOrders } = useCashierOrders(user?.restaurantId);
  const theme = useThemeSync(user?.restaurantId, "cashier");

  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [selectedGroup, setSelectedGroup] = useState<TableGroup | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [tableNum, setTableNum] = useState("");
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [billRequestedTables, setBillRequestedTables] = useState<Record<string, boolean>>({});
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

  // Bill-requested realtime
  useEffect(() => {
    if (!user?.restaurantId) return;
    const restaurantId = user.restaurantId;
    supabase.from("tables").select("id, bill_requested").eq("restaurant_id", restaurantId).then(({ data }) => {
      if (!data) return;
      const map: Record<string, boolean> = {};
      data.forEach((t) => { map[t.id] = t.bill_requested ?? false; });
      setBillRequestedTables(map);
    });
    const channel = supabase
      .channel(`cashier-tables-${restaurantId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tables", filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => setBillRequestedTables((prev) => ({ ...prev, [payload.new.id]: payload.new.bill_requested ?? false })))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.restaurantId]);

  const markDelivered = async (group: TableGroup) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase.from("orders").update({ status: "DELIVERED", user_id: user?.id, payment_reference: paymentReference || null }).in("id", group.orders.map((o) => o.id)).eq("status", "READY");
      if (error) throw error;
      if (group.tableId) await supabase.from("tables").update({ status: "CLEANING", bill_requested: false }).eq("id", group.tableId);
      const receiptUrl = group.sessionId ? `/receipt/session/${group.sessionId}?rid=${user?.restaurantId}` : `/receipt/table/${group.tableId}?rid=${user?.restaurantId}`;
      window.open(receiptUrl, "_blank");
      setSelectedGroup(null);
      setPaymentReference("");
      await fetchOrders();
    } catch (err) {
      console.error("Error al procesar pago:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendAlert = async () => {
    if (!alertMsg.trim() || !user?.restaurantId) return;
    setSendingAlert(true);
    const { sendAlert } = await import("@menu-bites/auth");
    const { error } = await sendAlert({ restaurantId: user.restaurantId, userId: user.id, userEmail: user.email, type: "BILL_REQUEST", message: alertMsg.trim(), tableNumber: tableNum ? parseInt(tableNum) : undefined });
    setSendingAlert(false);
    if (!error) {
      setAlertSent(true);
      setTimeout(() => { setAlertSent(false); setAlertModal(false); setAlertMsg(""); setTableNum(""); }, 1500);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try { await signOut(); } finally { clearAuth(); window.location.href = process.env.NEXT_PUBLIC_AUTH_URL ?? "/"; }
  };

  const pendingGroups = groupOrders(orders, billRequestedTables);
  const historyGroups = groupOrders(history, billRequestedTables);
  const totalPending  = pendingGroups.reduce((s, g) => s + g.total, 0);
  const totalHistory  = historyGroups.reduce((s, g) => s + g.total, 0);

  const currentGroups = activeTab === "pending" ? pendingGroups : historyGroups;
  const filtered = currentGroups.filter((g) =>
    g.tableNumber?.toString().includes(searchQuery) || g.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RestaurantThemeProvider theme={theme ?? undefined} isGlobal>
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <CashierHeader
          userEmail={user?.email}
          restaurantId={user?.restaurantId}
          isSigningOut={isSigningOut}
          isRefreshing={loading}
          totalPending={totalPending}
          alertCount={pendingGroups.filter((g) => g.billRequested).length}
          searchQuery={searchQuery}
          isSearchExpanded={isSearchExpanded}
          onSearchChange={setSearchQuery}
          onSearchToggle={() => setIsSearchExpanded((p) => !p)}
          onAlertClick={() => setAlertModal(true)}
          onRefresh={fetchOrders}
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
                {tab === "pending" && pendingGroups.length > 0 && (
                  <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-[10px]">{pendingGroups.length}</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Caja Pendiente</span>
              <span className="text-xl font-black text-emerald-400"><AnimatedNumber value={totalPending} formatFn={formatCLP} /></span>
            </div>
            <div className="h-10 w-px bg-white/5" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Cobrado hoy</span>
              <span className="text-xl font-black text-foreground/80"><AnimatedNumber value={totalHistory} formatFn={formatCLP} /></span>
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

          <BillAlertIsland groups={pendingGroups} onSelect={setSelectedGroup} />
        </main>

        {selectedGroup && (
          <PaymentSlideOver group={selectedGroup} paymentReference={paymentReference} isProcessing={isProcessing} onPaymentRefChange={setPaymentReference} onConfirm={() => markDelivered(selectedGroup)} onClose={() => setSelectedGroup(null)} />
        )}

        {alertModal && (
          <AlertModal tableNum={tableNum} alertMsg={alertMsg} sendingAlert={sendingAlert} alertSent={alertSent} onTableNumChange={setTableNum} onMsgChange={setAlertMsg} onSend={handleSendAlert} onClose={() => setAlertModal(false)} />
        )}
      </div>
    </RestaurantThemeProvider>
  );
}
