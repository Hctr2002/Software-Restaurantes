"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@menu-bites/store";
import { supabase, useTables, signOut, sendAlert, updateOrderStatus, AlertType, getRestaurantTheme, timeAgo } from "@menu-bites/auth";
import { LayoutDashboard, LogOut, User, AlertTriangle, X, Loader2, CheckCircle, XCircle, Receipt, Bell, UtensilsCrossed, Sparkles, MessageSquare, ChevronDown, ChevronUp, RefreshCw, Hash, Link2, Link2Off } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TableGrid, TableCard, Button, Badge, RestaurantThemeProvider, CardSkeleton, OrderCardSkeleton } from "@menu-bites/ui";

const READY_SFX = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";



const ALERT_OPTIONS: { type: AlertType; label: string; color: string }[] = [
  { type: "TABLE_ISSUE",  label: "Problema en Mesa", color: "border-red-500/40 text-red-400 hover:bg-red-500/10" },
  { type: "BILL_REQUEST", label: "Pedir Cuenta",      color: "border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10" },
  { type: "HELP_REQUEST", label: "Necesito Ayuda",    color: "border-blue-500/40 text-blue-400 hover:bg-blue-500/10" },
  { type: "GENERAL",      label: "Mensaje General",   color: "border-border text-muted-foreground hover:bg-foreground/10" },
];

type PendingOrder = {
  id: string;
  status: string;
  table_id: string | null;
  total_amount: number;
  createdAt: string;
  tables: { number: number } | null;
  order_items: { id: string; quantity: number; menu_items: { name: string } | null }[];
};

export default function WaiterDashboard() {
  const { user, logout: clearAuth } = useAuthStore();
  const { tables, loading: tablesLoading } = useTables(user?.restaurantId);
  const router = useRouter();

  const [activeTab, setActiveTab]           = useState<"mesas" | "pedidos">("mesas");
  const [pendingOrders, setPendingOrders]   = useState<PendingOrder[]>([]);
  const [readyOrders, setReadyOrders]       = useState<PendingOrder[]>([]);
  const [ordersLoading, setOrdersLoading]   = useState(true);
  const [processingId, setProcessingId]     = useState<string | null>(null);
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);

  // W2.1: sonido cuando llegan órdenes READY
  const prevReadyCountRef = useRef(0);
  useEffect(() => {
    if (readyOrders.length > prevReadyCountRef.current) {
      new Audio(READY_SFX).play().catch(() => {});
    }
    prevReadyCountRef.current = readyOrders.length;
  }, [readyOrders.length]);

  // W2.4: notas por orden pendiente
  const [notesByOrder, setNotesByOrder] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  const handleSaveNote = async (orderId: string) => {
    setSavingNoteId(orderId);
    await supabase.from("orders").update({ notes: notesByOrder[orderId] ?? "" }).eq("id", orderId);
    setSavingNoteId(null);
  };

  // W2.3: liberar mesa tras limpieza
  const handleTableClean = async (tableId: string) => {
    await supabase.from("tables").update({ status: "FREE" }).eq("id", tableId);
  };

  // W5.2: fusión de mesas
  const [mergeMode, setMergeMode]         = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<Set<string>>(new Set());
  const [merging, setMerging]             = useState(false);
  const [mergeResult, setMergeResult]     = useState<string | null>(null);

  const toggleMergeSelect = (tableId: string) => {
    setSelectedForMerge((prev) => {
      const next = new Set(prev);
      next.has(tableId) ? next.delete(tableId) : next.add(tableId);
      return next;
    });
  };

  const handleMergeTables = async () => {
    if (selectedForMerge.size < 2) return;
    setMerging(true);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableIds: Array.from(selectedForMerge) }),
    });
    const json = await res.json();
    setMerging(false);
    if (res.ok) {
      setMergeResult(`Mesas fusionadas — ${json.ordersUpdated} pedido(s) unificados.`);
      setMergeMode(false);
      setSelectedForMerge(new Set());
      setTimeout(() => setMergeResult(null), 4000);
    }
  };

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [alertModal, setAlertModal]     = useState(false);
  const [alertType, setAlertType]       = useState<AlertType>("HELP_REQUEST");
  const [alertMsg, setAlertMsg]         = useState("");
  const [tableNum, setTableNum]         = useState("");
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertSent, setAlertSent]       = useState(false);
  const [theme, setTheme]               = useState<any>(null);

  const fetchPendingOrders = useCallback(async () => {
    if (!user?.restaurantId) return;
    setOrdersLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("id, status, table_id, total_amount, createdAt, tables(number), order_items(id, quantity, menu_items(name))")
      .eq("restaurant_id", user.restaurantId)
      .in("status", ["PENDING", "READY"])
      .order("createdAt", { ascending: true });

    const rows = (data as any[]) ?? [];
    setPendingOrders(rows.filter((o) => o.status === "PENDING"));
    setReadyOrders(rows.filter((o) => o.status === "READY"));
    setOrdersLoading(false);
  }, [user?.restaurantId]);

  // W5.1: registro del service worker y suscripción a Web Push
  React.useEffect(() => {
    if (!user?.restaurantId || typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!VAPID_PUBLIC) return;

    (async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        let sub = await reg.pushManager.getSubscription();
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: VAPID_PUBLIC,
          });
        }
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        });
      } catch {
        // Push no disponible — degradar silenciosamente
      }
    })();
  }, [user?.restaurantId]);

  // W5.1: disparar notificación push cuando llega ORDER_READY
  const prevReadyForPush = useRef(0);
  useEffect(() => {
    if (!user?.restaurantId) return;
    if (readyOrders.length > prevReadyForPush.current) {
      const newReady = readyOrders.slice(prevReadyForPush.current);
      newReady.forEach((order) => {
        fetch("/api/push/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restaurantId: user.restaurantId, tableNumber: order.tables?.number }),
        }).catch(() => {});
      });
    }
    prevReadyForPush.current = readyOrders.length;
  }, [readyOrders.length, user?.restaurantId]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!user?.restaurantId) return;
    const restaurantId = user.restaurantId;

    getRestaurantTheme(restaurantId).then(setTheme);

    const themeChannel = supabase
      .channel(`waiter-theme-${restaurantId}`)
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

    return () => { supabase.removeChannel(themeChannel); };
  }, [user?.restaurantId]);

  useEffect(() => {
    if (!user?.restaurantId) return;
    fetchPendingOrders();

    const channel = supabase
      .channel(`waiter-orders-${user.restaurantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${user.restaurantId}` },
        () => { fetchPendingOrders(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPendingOrders, user?.restaurantId]);

  const handleValidate = async (order: PendingOrder) => {
    setProcessingId(order.id);
    await updateOrderStatus(order.id, "VALIDATED");
    setProcessingId(null);
  };

  const handleReject = async (order: PendingOrder) => {
    setProcessingId(order.id);
    await updateOrderStatus(order.id, "REJECTED");

    // Si la mesa no tiene más órdenes activas, liberarla
    if (order.table_id) {
      const { data: remaining } = await supabase
        .from("orders")
        .select("id")
        .eq("table_id", order.table_id)
        .not("status", "in", '("REJECTED","DELIVERED")')
        .neq("id", order.id);

      if (!remaining || remaining.length === 0) {
        await supabase
          .from("tables")
          .update({ status: "FREE" })
          .eq("id", order.table_id);
      }
    }

    setProcessingId(null);
  };

  const handleSignOut = async () => {
    const loginUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3000';
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      clearAuth();
      router.refresh();
      window.location.href = loginUrl;
    }
  };

  const handleSendAlert = async () => {
    if (!alertMsg.trim() || !user?.restaurantId) return;
    setSendingAlert(true);
    const { error } = await sendAlert({
      restaurantId: user.restaurantId,
      userId:       user.id,
      userEmail:    user.email,
      type:         alertType,
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
        setAlertType("HELP_REQUEST");
      }, 1500);
    }
  };

  const billRequestedTableIds = new Set(tables.filter((t) => t.bill_requested).map((t) => t.id));
  const readyTableIds         = new Set(readyOrders.map((o) => o.table_id).filter(Boolean));
  const cleaningTables        = tables.filter((t) => t.status === "CLEANING");

  const loading = tablesLoading;

  if (loading) {
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
    <RestaurantThemeProvider theme={theme} isGlobal={true}>
      <div className="min-h-screen bg-background text-foreground pb-32 font-sans flex flex-col">
        {/* Header Premium */}
        <header className="border-b border-border/10 px-6 py-5 flex items-center justify-between bg-card/40 backdrop-blur-2xl sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative w-10 h-10 bg-card border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
                <UtensilsCrossed className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-foreground leading-none">
                Terminal <span className="text-primary">Garzón</span>
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </div>
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-60">
                  {user?.restaurantId?.split("-")[0] || "RESTAURANTE"} · EN LÍNEA
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block mr-2">
              <p className="text-xs font-bold text-foreground/80">{user?.email}</p>
              <p className="text-[9px] text-primary uppercase font-black tracking-widest">Servicio de Salón</p>
            </div>

            <div className="flex items-center bg-white/5 rounded-2xl p-1 border border-white/5">
              <button
                onClick={() => setAlertModal(true)}
                className="p-2.5 rounded-xl text-yellow-500 hover:bg-yellow-500/10 transition-all active:scale-90"
                title="Nueva Alerta"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>

              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="p-2.5 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90"
                title="Salir"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Island 2.0 (Interactivo/Expandible) */}
        <div className="px-6 py-4 flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {readyOrders.length > 0 && (
              <motion.div 
                layout
                initial={{ height: 80, opacity: 0, y: -20 }}
                animate={{ height: isIslandExpanded ? "auto" : 80, opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -20 }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                className="relative group overflow-hidden bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] p-4 flex flex-col transition-all hover:bg-emerald-500/15"
              >
                <div className="absolute top-0 right-0 w-32 h-full bg-emerald-500/5 blur-3xl -z-10"></div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30"
                    >
                      <Sparkles className="w-6 h-6 text-emerald-400" />
                    </motion.div>
                    <div>
                      <h3 className="font-black text-sm text-emerald-400 uppercase tracking-widest leading-none mb-1.5">
                        Cocina Despachando
                      </h3>
                      <p className="text-[10px] text-emerald-400/60 font-black uppercase tracking-widest">
                        {readyOrders.length} {readyOrders.length === 1 ? "Plato listo" : "Platos listos"}
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setIsIslandExpanded(!isIslandExpanded)}
                    className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-emerald-400"
                  >
                    <motion.div
                      animate={{ rotate: isIslandExpanded ? 180 : 0 }}
                    >
                      <ChevronDown className="w-5 h-5" />
                    </motion.div>
                  </button>
                </div>

                <AnimatePresence>
                  {isIslandExpanded && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                    >
                      {readyOrders.map((order) => (
                        <motion.div 
                          key={order.id} 
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="bg-emerald-500/20 border border-emerald-500/30 rounded-[1.5rem] p-4 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/30 flex items-center justify-center text-[12px] font-black text-white">
                              {order.tables?.number}
                            </div>
                            <div>
                              <p className="text-xs font-black text-white">{order.order_items[0]?.menu_items?.name}</p>
                              <p className="text-[9px] text-emerald-400/70 font-bold uppercase">Listo para retirar</p>
                            </div>
                          </div>
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 bg-emerald-500 text-black rounded-xl hover:bg-emerald-400 transition-all"
                            onClick={() => handleValidate(order)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </motion.button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col md:flex-row gap-3">
            <AnimatePresence>
              {cleaningTables.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 bg-sky-500/10 border border-sky-500/20 rounded-[2.5rem] p-5 flex items-center justify-between gap-4"
                >
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
                      <button
                        key={t.id}
                        onClick={() => handleTableClean(t.id)}
                        className="bg-sky-500/20 hover:bg-sky-500/30 text-[10px] font-black text-white px-4 py-3 rounded-2xl border border-sky-500/30 transition-all active:scale-95"
                      >
                        Mesa {t.number} ✓
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {tables.some(t => t.bill_requested) && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 bg-yellow-500/10 border border-yellow-500/20 rounded-[2.5rem] p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                      <Receipt className="w-5 h-5 text-yellow-400 animate-bounce-slow" />
                    </div>
                    <div>
                      <h3 className="font-black text-xs text-yellow-400 uppercase tracking-widest leading-none mb-1.5">Cuentas</h3>
                      <p className="text-[10px] text-yellow-400/60 font-black uppercase tracking-widest">{tables.filter(t => t.bill_requested).length} Por cobrar</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {tables.filter(t => t.bill_requested).slice(0, 2).map((t) => (
                      <div key={t.id} className="bg-yellow-500/20 text-[10px] font-black text-white px-4 py-3 rounded-2xl border border-yellow-500/30">
                        Mesa {t.number}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2">
          <div className="flex p-1.5 bg-card/60 backdrop-blur-md rounded-[1.5rem] border border-white/5 w-fit gap-2">
            <button
              onClick={() => setActiveTab("mesas")}
              className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                activeTab === "mesas"
                  ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Mesas
            </button>
            <button
              onClick={() => setActiveTab("pedidos")}
              className={`relative flex items-center gap-2 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                activeTab === "pedidos"
                  ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <Bell className="w-4 h-4" />
              Pedidos
              {pendingOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center bg-red-500 text-white rounded-full text-[9px] font-black border-2 border-card animate-in zoom-in duration-300">
                  {pendingOrders.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Main Workspace */}
        <main className="flex-1 px-6 py-8">
          <AnimatePresence mode="wait">
            {activeTab === "mesas" ? (
              <motion.div 
                key="mesas"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-4xl font-black tracking-tighter">Gestión de <span className="text-primary">Salón</span></h2>
                    <p className="text-muted-foreground text-xs font-black uppercase tracking-widest opacity-60">
                      {mergeMode ? "Selecciona 2+ mesas OCCUPIED para fusionar" : "Selecciona una mesa para tomar comandas o ver estado"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => { setMergeMode((m) => !m); setSelectedForMerge(new Set()); }}
                    title={mergeMode ? "Cancelar fusión" : "Fusionar mesas"}
                    className={`rounded-xl w-11 h-11 shrink-0 transition-all ${mergeMode ? "border-primary/40 text-primary bg-primary/10" : "border-border/20"}`}
                  >
                    {mergeMode ? <Link2Off className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                  </Button>
                </div>

                {mergeResult && (
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black">
                    <CheckCircle className="w-4 h-4 shrink-0" /> {mergeResult}
                  </div>
                )}

                {mergeMode && selectedForMerge.size >= 2 && (
                  <Button
                    onClick={handleMergeTables}
                    disabled={merging}
                    className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest gap-2 shadow-lg shadow-primary/20"
                  >
                    {merging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                    Fusionar {selectedForMerge.size} mesas seleccionadas
                  </Button>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {tables.map((table) => {
                    const isBillRequested = billRequestedTableIds.has(table.id);
                    const isReady         = readyTableIds.has(table.id);
                    const isCleaning      = table.status === "CLEANING";

                    return (
                      <motion.div 
                        key={table.id} 
                        layout
                        whileHover={{ y: -8, scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        className={`relative group perspective ${mergeMode && table.status === "OCCUPIED" ? "cursor-pointer" : ""}`}
                        onClick={() => {
                          if (mergeMode && table.status === "OCCUPIED") {
                            toggleMergeSelect(table.id);
                          } else if (!mergeMode) {
                            router.push(`/tables/${table.id}/menu`);
                          }
                        }}
                      >
                        {/* Indicador de selección en modo fusión */}
                        {mergeMode && table.status === "OCCUPIED" && (
                          <div className={`absolute inset-0 z-10 rounded-[inherit] border-2 transition-all ${
                            selectedForMerge.has(table.id)
                              ? "border-primary bg-primary/10"
                              : "border-transparent hover:border-primary/40"
                          }`} />
                        )}
                        {mergeMode && selectedForMerge.has(table.id) && (
                          <div className="absolute -top-2 -left-2 z-20 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/40">
                            <CheckCircle className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}

                        {/* Indicadores de Estado Flotantes */}
                        <div className="absolute -top-3 -right-3 z-20 flex flex-col gap-1.5 pointer-events-none">
                          {isReady && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="bg-emerald-500 text-black text-[8px] font-black px-2 py-1 rounded-lg shadow-lg animate-bounce"
                            >
                              LISTO
                            </motion.div>
                          )}
                          {isBillRequested && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="bg-yellow-500 text-black text-[8px] font-black px-2 py-1 rounded-lg shadow-lg"
                            >
                              CUENTA
                            </motion.div>
                          )}
                          {isCleaning && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="bg-sky-400 text-black text-[8px] font-black px-2 py-1 rounded-lg shadow-lg"
                            >
                              LIMPIAR
                            </motion.div>
                          )}
                        </div>

                        <div className={`relative bg-card/40 border border-white/5 rounded-[2.5rem] p-6 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer hover:bg-card/60 hover:border-white/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] ${
                          isBillRequested ? "ring-2 ring-yellow-500/30" : ""
                        } ${isReady ? "ring-2 ring-emerald-500/30" : ""}`}>
                          
                          <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center border transition-all ${
                            table.status === "FREE" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                            table.status === "OCCUPIED" ? "bg-primary/10 border-primary/20 text-primary" :
                            "bg-sky-500/10 border-sky-500/20 text-sky-400"
                          }`}>
                            <Hash className="w-8 h-8 font-black" />
                          </div>

                          <div className="text-center">
                            <p className="text-2xl font-black tracking-tighter leading-none mb-1">{table.number}</p>
                            <p className={`text-[9px] font-black uppercase tracking-widest ${
                               table.status === "FREE" ? "text-emerald-400" :
                               table.status === "OCCUPIED" ? "text-primary" :
                               "text-sky-400"
                            }`}>
                              {table.status}
                            </p>
                          </div>

                          {/* Efecto de Glow Dinámico */}
                          {isReady && (
                            <div className="absolute -inset-0.5 bg-emerald-500/20 rounded-[2.6rem] blur animate-pulse -z-10"></div>
                          )}
                          {isBillRequested && (
                            <div className="absolute -inset-0.5 bg-yellow-500/20 rounded-[2.6rem] blur animate-pulse -z-10"></div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {tables.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-32 gap-6 text-muted-foreground border-2 border-dashed border-white/5 rounded-[3rem]">
                    <div className="w-24 h-24 bg-card rounded-[2.5rem] flex items-center justify-center border border-border/10">
                      <User className="w-10 h-10 opacity-20" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-widest opacity-40">No hay mesas configuradas</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="pedidos"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex flex-col gap-2">
                  <h2 className="text-4xl font-black tracking-tighter">Pedidos <span className="text-primary">Pendientes</span></h2>
                  <p className="text-muted-foreground text-xs font-black uppercase tracking-widest opacity-60">
                    Validación y notas de cocina para pedidos entrantes
                  </p>
                </div>

                {ordersLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <OrderCardSkeleton key={i} />)}
                  </div>
                ) : pendingOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 gap-6 text-muted-foreground border-2 border-dashed border-white/5 rounded-[3rem]">
                    <div className="w-24 h-24 bg-card rounded-[2.5rem] flex items-center justify-center border border-border/10">
                      <CheckCircle className="w-10 h-10 text-emerald-500/20" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-widest opacity-40">Todo está al día</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                      {pendingOrders.map((order) => (
                        <motion.div 
                          key={order.id} 
                          layout
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.2 } }}
                          className="bg-card/40 border border-white/5 rounded-[2.5rem] p-7 flex flex-col gap-6 hover:bg-card/60 hover:border-white/20 transition-all shadow-xl"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-black text-xl">
                                {order.tables?.number ?? "—"}
                              </div>
                              <div>
                                <h3 className="text-xl font-black tracking-tighter text-foreground leading-none">Mesa {order.tables?.number ?? "—"}</h3>
                                <p className="text-[9px] text-muted-foreground font-black tracking-widest uppercase mt-1.5 opacity-60">
                                  {timeAgo(order.createdAt)} · {order.order_items.length} Ítems
                                </p>
                              </div>
                            </div>
                            <Badge variant="warning" className="font-black text-[8px] px-3 py-1 rounded-lg">PENDIENTE</Badge>
                          </div>

                          <div className="bg-white/5 rounded-3xl p-5 space-y-3">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between group/item">
                                <div className="flex items-center gap-3">
                                  <span className="w-7 h-7 flex items-center justify-center bg-card border border-white/10 rounded-xl text-[10px] font-black text-primary">
                                    {item.quantity}
                                  </span>
                                  <span className="text-xs font-bold text-foreground/80 group-hover/item:text-foreground transition-colors truncate max-w-[180px]">
                                    {item.menu_items?.name ?? "Item"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Nota de Cocina Premium */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                              <label className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-70">
                                <MessageSquare className="w-3 h-3 text-primary" />
                                Instrucciones Especiales
                              </label>
                            </div>
                            <div className="relative group">
                              <input
                                type="text"
                                placeholder="Ej: Término medio, sin cebolla..."
                                value={notesByOrder[order.id] ?? ""}
                                onChange={(e) => setNotesByOrder((prev) => ({ ...prev, [order.id]: e.target.value }))}
                                className="w-full bg-background border border-white/5 rounded-2xl p-4 pr-16 focus:outline-none focus:border-primary/50 transition-all font-medium text-xs text-foreground placeholder:text-muted-foreground/30"
                              />
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleSaveNote(order.id)}
                                disabled={savingNoteId === order.id || !notesByOrder[order.id]}
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 rounded-xl bg-primary/10 text-primary font-black text-[10px] uppercase tracking-widest border border-primary/20 hover:bg-primary hover:text-white transition-all disabled:opacity-30"
                              >
                                {savingNoteId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Guardar"}
                              </motion.button>
                            </div>
                          </div>

                          <div className="flex gap-4 pt-2">
                            <Button
                              onClick={() => handleReject(order)}
                              disabled={processingId === order.id}
                              variant="outline"
                              className="flex-1 h-16 rounded-[1.5rem] border-white/5 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all"
                            >
                              {processingId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Rechazar"}
                            </Button>
                            <Button
                              onClick={() => handleValidate(order)}
                              disabled={processingId === order.id}
                              className="flex-1 h-16 rounded-[1.5rem] bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 transition-all"
                            >
                              {processingId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Validar"}
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Mobile Navbar Premium */}
        <nav className="fixed bottom-6 inset-x-6 z-40 sm:hidden">
          <div className="bg-card/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-4 flex justify-around items-center shadow-2xl">
             <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] opacity-40">
               Terminal de Garzón · V2.2
             </span>
          </div>
        </nav>

        {/* Modal de Alerta Pro Max */}
        <AnimatePresence>
          {alertModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/80 backdrop-blur-xl" 
                onClick={() => setAlertModal(false)}
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-lg bg-card border border-white/10 rounded-[3rem] p-10 shadow-2xl space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-yellow-500/10 rounded-[1.5rem] flex items-center justify-center border border-yellow-500/20">
                      <AlertTriangle className="w-7 h-7 text-yellow-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tighter text-foreground leading-none">Canal de Emergencia</h2>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1.5 opacity-60">Notificación directa al administrador</p>
                    </div>
                  </div>
                  <button onClick={() => setAlertModal(false)} className="p-3 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {ALERT_OPTIONS.map((opt) => (
                    <button
                      key={opt.type}
                      onClick={() => setAlertType(opt.type)}
                      className={`px-5 py-4 rounded-[1.5rem] border text-[10px] font-black uppercase tracking-widest transition-all text-center ${
                        alertType === opt.type 
                          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                          : "bg-white/5 border-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="table_num" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1 block opacity-70">N° de Mesa Afectada</label>
                    <input
                      id="table_num"
                      type="number"
                      placeholder="Ej. 5"
                      value={tableNum}
                      onChange={(e) => setTableNum(e.target.value)}
                      className="w-full bg-background border border-white/5 rounded-[1.5rem] p-5 focus:outline-none focus:border-yellow-500/50 transition-all font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="alert_msg" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 ml-1 block opacity-70">Descripción del Problema</label>
                    <textarea
                      id="alert_msg"
                      rows={3}
                      placeholder="Escribe los detalles aquí..."
                      value={alertMsg}
                      onChange={(e) => setAlertMsg(e.target.value)}
                      className="w-full bg-background border border-white/5 rounded-[1.5rem] p-5 focus:outline-none focus:border-yellow-500/50 transition-all font-bold text-sm resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-2">
                  <Button variant="outline" onClick={() => setAlertModal(false)} className="flex-1 h-16 rounded-[1.5rem] border-white/5 font-black uppercase text-[10px] tracking-[0.2em]">Cancelar</Button>
                  <Button
                    onClick={handleSendAlert}
                    disabled={!alertMsg.trim() || sendingAlert || alertSent}
                    className="flex-1 h-16 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-yellow-500/20"
                  >
                    {alertSent ? "✓ Enviado" : sendingAlert ? <Loader2 className="w-5 h-5 animate-spin" /> : "Emitir Alerta"}
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </RestaurantThemeProvider>
  );
}
