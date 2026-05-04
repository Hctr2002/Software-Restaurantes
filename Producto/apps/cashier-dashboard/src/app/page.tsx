"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@menu-bites/store";
import { supabase, signOut, sendAlert, getSession, getRestaurantTheme, formatCLP, timeAgo } from "@menu-bites/auth";
import { Badge, Button, RestaurantThemeProvider, OrderCardSkeleton } from "@menu-bites/ui";
import {
  Receipt, LogOut, CheckCircle, Loader2, AlertTriangle, RefreshCw,
  History, Bell, Search, Clock, Hash, ChevronRight, CreditCard, ArrowLeft
} from "lucide-react";
import { AlertModal } from "./_components/AlertModal";
import { OrderGroupCard, groupOrders, type Order, type TableGroup } from "./_components/OrderGroupCard";
import { PaymentSlideOver } from "./_components/PaymentSlideOver";

const AnimatedNumber = ({ value, formatFn }: { value: number; formatFn: (n: number) => string }) => (
  <motion.span
    key={value}
    initial={{ opacity: 0, y: -5 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 5 }}
    transition={{ duration: 0.3 }}
    className="inline-block"
  >
    {formatFn(value)}
  </motion.span>
);

export default function CashierPage() {
  const { user, setUser, logout: clearAuth } = useAuthStore();
  const [orders, setOrders]       = useState<Order[]>([]);
  const [history, setHistory]     = useState<Order[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  
  const [selectedGroup, setSelectedGroup] = useState<TableGroup | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [alertModal, setAlertModal] = useState(false);
  const [alertMsg, setAlertMsg]   = useState("");
  const [tableNum, setTableNum]   = useState("");
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [theme, setTheme] = useState<any>(null);
  const [billRequestedTables, setBillRequestedTables] = useState<Record<string, boolean>>({});

  // Pro Max UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);


  // Hydrate store
  useEffect(() => {
    if (user) return;
    getSession().then((session) => {
      if (!session) return;
      setUser({
        id:           session.user.id,
        email:        session.user.email ?? "",
        role:         session.user.app_metadata?.role,
        restaurantId: session.user.app_metadata?.restaurant_id,
      });
    });
  }, [user, setUser]);

  // Theme Sync
  useEffect(() => {
    if (!user?.restaurantId) return;
    const restaurantId = user.restaurantId;

    getRestaurantTheme(restaurantId).then(setTheme);

    const channel = supabase
      .channel(`cashier-theme-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "restaurant_themes", filter: `restaurant_id=eq.${restaurantId}` },
        async (payload) => {
          if (payload.new.is_active) {
            const updated = await getRestaurantTheme(restaurantId);
            setTheme(updated);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.restaurantId]);

  const fetchOrders = useCallback(async () => {
    if (!user?.restaurantId) { setLoading(false); return; }
    setLoading(true);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const SELECT = "id, status, createdAt, total_amount, table_id, session_id, tables(id, number), users(email), order_items(id, quantity, unit_price, menu_items(name))";
    const [pendingRes, historyRes] = await Promise.all([
      supabase
        .from("orders")
        .select(SELECT)
        .eq("restaurant_id", user.restaurantId)
        .eq("status", "READY")
        .order("createdAt", { ascending: true }),
      supabase
        .from("orders")
        .select(SELECT)
        .eq("restaurant_id", user.restaurantId)
        .eq("status", "DELIVERED")
        .gte("createdAt", today.toISOString())
        .order("createdAt", { ascending: false })
        .limit(20)
    ]);

    setOrders((pendingRes.data as any) || []);
    setHistory((historyRes.data as any) || []);
    setLoading(false);
  }, [user?.restaurantId]);

  useEffect(() => {
    if (!user?.restaurantId) return;

    fetchOrders();

    const ordersChannel = supabase
      .channel("cashier-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${user.restaurantId}` },
        fetchOrders
      )
      .subscribe();

    return () => { supabase.removeChannel(ordersChannel); };
  }, [fetchOrders, user?.restaurantId]);

  // Suscripción Realtime a tables para bill_requested
  useEffect(() => {
    if (!user?.restaurantId) return;
    const restaurantId = user.restaurantId;

    // Carga inicial
    supabase
      .from("tables")
      .select("id, bill_requested")
      .eq("restaurant_id", restaurantId)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, boolean> = {};
        data.forEach((t) => { map[t.id] = t.bill_requested ?? false; });
        setBillRequestedTables(map);
      });

    const tablesChannel = supabase
      .channel(`cashier-tables-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tables", filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          setBillRequestedTables((prev) => ({
            ...prev,
            [payload.new.id]: payload.new.bill_requested ?? false,
          }));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(tablesChannel); };
  }, [user?.restaurantId]);

  const markDelivered = async (group: TableGroup) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // 1. Marcar todas las órdenes READY del grupo como DELIVERED
      const orderIds = group.orders.map((o) => o.id);
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          status: "DELIVERED",
          user_id: user?.id,
          payment_reference: paymentReference || null,
        })
        .in("id", orderIds)
        .eq("status", "READY");

      if (orderError) throw orderError;

      // 2. Pasar mesa a CLEANING — el garzón la libera tras limpiarla
      if (group.tableId) {
        await supabase
          .from("tables")
          .update({ status: "CLEANING", bill_requested: false })
          .eq("id", group.tableId);
      }

      // 3. Abrir comprobante en nueva pestaña
      const receiptUrl = group.sessionId
        ? `/receipt/session/${group.sessionId}?rid=${user?.restaurantId}`
        : `/receipt/table/${group.tableId}?rid=${user?.restaurantId}`;
      window.open(receiptUrl, "_blank");

      // 4. Reset
      setSelectedGroup(null);
      setPaymentReference("");
      await fetchOrders();
    } catch (err) {
      console.error("Error al procesar pago:", err);
      alert("Error al procesar el pago. Verifique conexión.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendAlert = async () => {
    if (!alertMsg.trim() || !user?.restaurantId) return;
    setSendingAlert(true);
    const { error } = await sendAlert({
      restaurantId: user.restaurantId,
      userId:       user.id,
      userEmail:    user.email,
      type:         "BILL_REQUEST",
      message:      alertMsg.trim(),
      tableNumber:  tableNum ? parseInt(tableNum) : undefined,
    });
    setSendingAlert(false);
    if (!error) {
      setAlertSent(true);
      setTimeout(() => {
        setAlertSent(false);
        setAlertModal(false);
        setAlertMsg("");
        setTableNum("");
      }, 1500);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try { await signOut(); } finally {
      clearAuth();
      window.location.href = process.env.NEXT_PUBLIC_AUTH_URL ?? "/";
    }
  };

  const pendingGroups = groupOrders(orders, billRequestedTables);
  const historyGroups = groupOrders(history, billRequestedTables);
  const totalPending  = pendingGroups.reduce((s, g) => s + g.total, 0);
  const totalHistory  = historyGroups.reduce((s, g) => s + g.total, 0);

  return (
    <RestaurantThemeProvider theme={theme} isGlobal={true}>
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        {/* Header Premium */}
        <header className="border-b border-border/10 px-8 py-5 flex items-center justify-between bg-card/40 backdrop-blur-2xl sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative w-12 h-12 bg-card border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
                <Receipt className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-foreground leading-none">
                Terminal <span className="text-primary">Caja</span>
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-70">
                  {user?.restaurantId?.split("-")[0] || "RESTAURANTE"} · LIVE
                </p>
              </div>
            </div>
          </div>

          {/* Resumen Premium en Header */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Search Bar Expandible */}
            <div className="relative flex items-center h-12">
              <AnimatePresence>
                {isSearchExpanded && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 240, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="overflow-hidden mr-2"
                  >
                    <input
                      type="text"
                      placeholder="Buscar mesa o sesión..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-primary/50 transition-all"
                      autoFocus
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                className={`p-2.5 rounded-xl transition-all ${isSearchExpanded ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground hover:text-foreground"}`}
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-2xl px-5 py-2.5 backdrop-blur-md flex items-center gap-4 group hover:bg-white/10 transition-all cursor-default">
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
            
            <div className="bg-white/5 border border-white/5 rounded-2xl px-5 py-2.5 backdrop-blur-md flex items-center gap-4 group hover:bg-white/10 transition-all cursor-default">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Bell className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Alertas Mesa</p>
                <div className="text-sm font-black text-foreground leading-none">
                  <AnimatedNumber value={pendingGroups.filter(g => g.billRequested).length} formatFn={(n) => n.toString()} />
                </div>
              </div>
            </div>
          </div>


          <div className="flex items-center gap-3">
            <div className="text-right hidden xl:block mr-2">
              <p className="text-xs font-bold text-foreground/80">{user?.email}</p>
              <p className="text-[9px] text-primary uppercase font-black tracking-widest">Cajero Principal</p>
            </div>

            <div className="flex items-center bg-white/5 rounded-2xl p-1 border border-white/5">
              <button
                onClick={fetchOrders}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all active:scale-90"
                title="Actualizar"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={() => setAlertModal(true)}
                className="p-2 rounded-xl text-yellow-500 hover:bg-yellow-500/10 transition-all active:scale-90"
                title="Nueva Alerta"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>

              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="p-2 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90"
                title="Salir"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Tabs & Stats */}
        <div className="px-8 py-6 bg-card/30 border-b border-border/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex p-1.5 bg-card rounded-2xl border border-border/10 w-fit">
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === "pending" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="w-4 h-4" />
              Pendientes
              {pendingGroups.length > 0 && (
                <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-[10px]">{pendingGroups.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === "history" ? "bg-secondary text-secondary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <History className="w-4 h-4" />
              Historial
            </button>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Caja Pendiente</span>
              <span className="text-xl font-black text-emerald-400">
                <AnimatedNumber value={totalPending} formatFn={formatCLP} />
              </span>
            </div>
            <div className="h-10 w-px bg-white/5" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Cobrado hoy</span>
              <span className="text-xl font-black text-foreground/80">
                <AnimatedNumber value={totalHistory} formatFn={formatCLP} />
              </span>
            </div>
          </div>

        </div>

        {/* Main Content */}
        <main className="flex-1 p-8 relative">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <OrderCardSkeleton key={i} />
                ))}
              </motion.div>
            ) : (() => {
              const currentGroups = activeTab === "pending" ? pendingGroups : historyGroups;
              const filtered = currentGroups.filter(g => 
                g.tableNumber?.toString().includes(searchQuery) || 
                g.key.toLowerCase().includes(searchQuery.toLowerCase())
              );

              if (filtered.length === 0) {
                return (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col items-center justify-center py-32 gap-6 text-muted-foreground"
                  >
                    <div className="w-24 h-24 bg-card rounded-[2.5rem] flex items-center justify-center border border-border/10">
                      {activeTab === "pending" ? <CheckCircle className="w-10 h-10 text-emerald-500/20" /> : <History className="w-10 h-10 text-slate-700" />}
                    </div>
                    <p className="text-sm font-bold tracking-tight">
                      {searchQuery ? "No se encontraron resultados" : (activeTab === "pending" ? "No hay cuentas listas para cobro" : "Aún no has procesado cobros hoy")}
                    </p>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6"
                >
                  {filtered.map((group, index) => {
                    const allItems = group.orders.flatMap((o) => o.order_items);
                    const previewItems = allItems.slice(0, 4);
                    const extraCount  = allItems.length - previewItems.length;
                    const tableLabel  = group.sessionId
                      ? `Mesas fusionadas`
                      : `Mesa ${group.tableNumber ?? "S/N"}`;

                    return (
                      <motion.div
                        key={group.key}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`group relative bg-card/40 border border-white/5 rounded-[2.5rem] p-7 flex flex-col transition-all hover:bg-card/60 hover:border-white/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] ${
                          activeTab === "history" ? "opacity-75" : ""
                        } ${group.billRequested ? "ring-2 ring-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.1)]" : ""}`}
                        onClick={() => activeTab === "pending" && setSelectedGroup(group)}
                      >
                        {/* Efecto de Glow para Cuenta Solicitada */}
                        {group.billRequested && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute -inset-0.5 bg-yellow-500/20 rounded-[2.6rem] blur animate-pulse -z-10"
                          />
                        )}

                        <div className="flex items-start justify-between mb-8">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors ${
                              group.billRequested ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-500" : "bg-white/5 border-white/10 text-primary"
                            }`}>
                              <Hash className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-black text-foreground tracking-tighter leading-none">{tableLabel}</h3>
                              <p className="text-[10px] text-muted-foreground font-black tracking-widest uppercase mt-1.5 opacity-60">
                                {group.orders.length} {group.orders.length > 1 ? "Comandas" : "Comanda"}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                {timeAgo(group.oldestCreatedAt)}
                              </span>
                            </div>
                            <Badge variant={activeTab === "pending" ? "success" : "neutral"} className="font-black text-[9px] px-2.5 py-1 rounded-lg">
                              {activeTab === "pending" ? "READY" : "PAGADO"}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex-1 space-y-2 mb-6">
                          {previewItems.map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className="flex justify-between items-center group/item">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-muted-foreground bg-foreground/5 w-6 h-6 flex items-center justify-center rounded-lg">{item.quantity}</span>
                                <span className="text-xs font-bold text-muted-foreground group-hover/item:text-foreground transition-colors truncate max-w-[120px]">
                                  {item.menu_items?.name ?? "Item"}
                                </span>
                              </div>
                              <span className="text-xs font-black text-muted-foreground font-mono">
                                {formatCLP(Number(item.unit_price) * item.quantity)}
                              </span>
                            </div>
                          ))}
                          {extraCount > 0 && (
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest text-center pt-1">
                              + {extraCount} ítems adicionales
                            </p>
                          )}
                        </div>

                        <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Cuenta</span>
                            <span className="text-2xl font-black text-emerald-400 tracking-tighter">{formatCLP(group.total)}</span>
                          </div>

                          {activeTab === "pending" ? (
                            <Button
                              className={`w-full h-16 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl ${
                                group.billRequested 
                                  ? "bg-yellow-500 text-black hover:bg-yellow-400 shadow-yellow-500/20" 
                                  : "bg-white text-slate-950 hover:bg-primary hover:text-white shadow-black/20"
                              }`}
                            >
                              Procesar Pago
                              <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                          ) : (
                            <div className="flex items-center justify-center gap-2 py-3 bg-white/5 rounded-2xl border border-white/5">
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pagado</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              );
            })()}
          </AnimatePresence>

          {/* Island Alert (Tarjeta Flotante Lateral) */}
          <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-4 pointer-events-none">
            <AnimatePresence>
              {pendingGroups.filter(g => g.billRequested).map((g) => (
                <motion.div
                  key={`alert-${g.key}`}
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 300, opacity: 0 }}
                  className="pointer-events-auto bg-card/90 backdrop-blur-xl border border-yellow-500/50 rounded-2xl p-5 shadow-2xl flex items-center gap-4 w-72"
                >
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
                    <Bell className="w-5 h-5 text-black" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Cuenta Solicitada</p>
                    <p className="text-sm font-black text-foreground">Mesa {g.tableNumber ?? "S/N"}</p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-yellow-500 text-black h-8 px-3 rounded-lg text-[9px] font-black"
                    onClick={() => setSelectedGroup(g)}
                  >
                    COBRAR
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </main>


        {/* Payment Slide-over */}
        {selectedGroup && (
          <PaymentSlideOver
            group={selectedGroup}
            paymentReference={paymentReference}
            isProcessing={isProcessing}
            onPaymentRefChange={setPaymentReference}
            onConfirm={() => markDelivered(selectedGroup)}
            onClose={() => setSelectedGroup(null)}
          />
        )}


        {alertModal && (
          <AlertModal
            tableNum={tableNum}
            alertMsg={alertMsg}
            sendingAlert={sendingAlert}
            alertSent={alertSent}
            onTableNumChange={setTableNum}
            onMsgChange={setAlertMsg}
            onSend={handleSendAlert}
            onClose={() => setAlertModal(false)}
          />
        )}
      </div>
    </RestaurantThemeProvider>
  );
}
