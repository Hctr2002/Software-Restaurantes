"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@menu-bites/store";
import { supabase, signOut, sendAlert, getSession, getRestaurantTheme } from "@menu-bites/auth";
import { Badge, Button, RestaurantThemeProvider } from "@menu-bites/ui";
import {
  Receipt, LogOut, CheckCircle, Loader2, AlertTriangle, X, RefreshCw, User,
  Clock, History, CreditCard, ChevronRight, Hash, ArrowLeft
} from "lucide-react";

type OrderItem = { id: string; quantity: number; unit_price: number; menu_items: { name: string } | null };
type Order = {
  id: string;
  status: string;
  createdAt: string;
  total_amount: number;
  table_id: string | null;
  tables: { id: string; number: number } | null;
  users: { email: string } | null;
  order_items: OrderItem[];
};

function orderTotal(order: Order) {
  return order.order_items.reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0);
}

function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n);
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "Ahora";
  if (diff === 1) return "1 min";
  if (diff < 60) return `${diff} min`;
  return `${Math.floor(diff / 60)}h`;
}

export default function CashierPage() {
  const { user, setUser, logout: clearAuth } = useAuthStore();
  const [orders, setOrders]       = useState<Order[]>([]);
  const [history, setHistory]     = useState<Order[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [alertModal, setAlertModal] = useState(false);
  const [alertMsg, setAlertMsg]   = useState("");
  const [tableNum, setTableNum]   = useState("");
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [theme, setTheme] = useState<any>(null);

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

    const [pendingRes, historyRes] = await Promise.all([
      supabase
        .from("orders")
        .select("id, status, createdAt, total_amount, table_id, tables(id, number), users(email), order_items(id, quantity, unit_price, menu_items(name))")
        .eq("restaurant_id", user.restaurantId)
        .eq("status", "READY")
        .order("createdAt", { ascending: true }),
      supabase
        .from("orders")
        .select("id, status, createdAt, total_amount, table_id, tables(id, number), users(email), order_items(id, quantity, unit_price, menu_items(name))")
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
    fetchOrders();

    const channel = supabase
      .channel("cashier-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchOrders)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchOrders]);

  const markDelivered = async (order: Order) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // 1. Actualizar orden (Cajero + Baucher)
      const { error: orderError } = await supabase
        .from("orders")
        .update({ 
          status: "DELIVERED",
          user_id: user?.id,
          payment_reference: paymentReference || null 
        })
        .eq("id", order.id);

      if (orderError) throw orderError;

      // 2. Liberar mesa
      if (order.table_id) {
        const { error: tableError } = await supabase
          .from("tables")
          .update({ status: "FREE" })
          .eq("id", order.table_id);
        
        if (tableError) console.error("Error al liberar mesa:", tableError);
      }

      // 3. Reset
      setSelectedOrder(null);
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

  const totalPending = orders.reduce((s, o) => s + orderTotal(o), 0);
  const totalHistory = history.reduce((s, o) => s + orderTotal(o), 0);

  return (
    <RestaurantThemeProvider theme={theme} isGlobal={true}>
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        {/* Header Premium */}
        <header className="border-b border-border/10 px-8 py-5 flex items-center justify-between bg-card/50 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Receipt className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-foreground">Terminal de <span className="text-primary">Caja</span></h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">En Línea · {user?.restaurantId?.split("-")[0]}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-foreground/70">{user?.email}</p>
              <p className="text-[10px] text-primary uppercase font-black">Turno Activo</p>
            </div>

            <div className="h-8 w-px bg-border/30 mx-2 hidden md:block" />

            <button
              onClick={fetchOrders}
              aria-label="Actualizar lista de pedidos"
              className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all active:scale-90"
              title="Actualizar"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setAlertModal(true)}
              aria-label="Enviar alerta al administrador"
              className="rounded-xl border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/10 hover:border-yellow-500/40 transition-all"
              title="Enviar alerta al administrador"
            >
              <AlertTriangle className="w-5 h-5" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleSignOut}
              aria-label="Cerrar sesión de caja"
              disabled={isSigningOut}
              className="rounded-xl border-white/5 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-500 transition-all"
            >
              <LogOut className="w-5 h-5" />
            </Button>
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
              {orders.length > 0 && (
                <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-[10px]">{orders.length}</span>
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
              <span className="text-xl font-black text-emerald-400">{formatCLP(totalPending)}</span>
            </div>
            <div className="h-10 w-px bg-white/5" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Cobrado hoy</span>
              <span className="text-xl font-black text-foreground/80">{formatCLP(totalHistory)}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="w-12 h-12 border-4 border-white/5 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Sincronizando órdenes...</p>
            </div>
          ) : (activeTab === "pending" ? orders : history).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6 text-muted-foreground">
              <div className="w-24 h-24 bg-card rounded-[2.5rem] flex items-center justify-center border border-border/10">
                {activeTab === "pending" ? <CheckCircle className="w-10 h-10 text-emerald-500/20" /> : <History className="w-10 h-10 text-slate-700" />}
              </div>
              <p className="text-sm font-bold tracking-tight">
                {activeTab === "pending" ? "No hay cuentas listas para cobro" : "Aún no has procesado cobros hoy"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
              {(activeTab === "pending" ? orders : history).map((order) => {
                const total = orderTotal(order);
                return (
                  <div 
                    key={order.id} 
                    className={`group relative bg-card/50 border border-border/5 rounded-[2rem] p-6 flex flex-col transition-all hover:bg-card hover:border-border/20 hover:shadow-2xl hover:shadow-black/20 ${activeTab === 'history' ? 'opacity-80' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center border border-white/5">
                            <Hash className="w-4 h-4 text-primary" />
                          </div>
                          <h3 className="text-xl font-black text-foreground tracking-tighter">Mesa {order.tables?.number ?? "S/N"}</h3>
                        </div>
                        {order.users?.email && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 uppercase font-black tracking-widest">
                            <User className="w-3 h-3" />
                            {order.users.email.split("@")[0]}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] font-black text-muted-foreground bg-foreground/5 px-2 py-1 rounded-lg border border-border/5">
                          {timeAgo(order.createdAt)}
                        </span>
                        <Badge variant={order.status === "READY" ? "success" : "neutral"} className="font-black text-[9px] px-2 py-0.5">
                          {order.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex-1 space-y-3 mb-6">
                      {order.order_items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex justify-between items-center group/item">
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
                      {order.order_items.length > 3 && (
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest text-center pt-2">
                          + {order.order_items.length - 3} ítems adicionales
                        </p>
                      )}
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Cuenta</span>
                        <span className="text-2xl font-black text-emerald-400 tracking-tighter">{formatCLP(total)}</span>
                      </div>
                      
                      {activeTab === "pending" ? (
                        <Button
                          onClick={() => setSelectedOrder(order)}
                          className="w-full h-14 bg-white text-slate-950 hover:bg-emerald-500 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all group-hover:scale-[1.02] shadow-xl shadow-black/20"
                        >
                          Revisar y Cobrar
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <div className="flex items-center justify-center gap-2 py-3 bg-white/5 rounded-2xl border border-white/5">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pagado</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Payment Slide-over / Modal (Detalle de Cuenta) */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md transition-opacity" onClick={() => setSelectedOrder(null)} />

            <div className="relative w-full max-w-lg bg-card h-full shadow-2xl border-l border-border/10 flex flex-col animate-in slide-in-from-right duration-300">
              {/* Modal Header */}
              <div className="p-8 border-b border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Volver</span>
                  </button>
                  <Badge variant="success" className="font-black px-3 py-1">LISTO PARA PAGO</Badge>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/20">
                    <Receipt className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tighter text-foreground">Mesa {selectedOrder.tables?.number ?? "S/N"}</h2>
                    <p className="text-xs text-muted-foreground font-bold">Orden #{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
              </div>

              {/* Modal Body (Items List) */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Detalle del Consumo</h3>
                  <div className="space-y-2">
                    {selectedOrder.order_items.map((item) => (
                      <div key={item.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 flex items-center justify-center bg-foreground/5 rounded-xl text-xs font-black text-foreground/70">
                            {item.quantity}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-foreground/80">{item.menu_items?.name ?? "Item"}</p>
                            <p className="text-[10px] text-muted-foreground font-bold">{formatCLP(Number(item.unit_price))} u/n</p>
                          </div>
                        </div>
                        <span className="text-sm font-black text-foreground/80 font-mono">
                          {formatCLP(Number(item.unit_price) * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span className="text-xs font-bold uppercase tracking-widest">Subtotal</span>
                    <span className="text-sm font-black font-mono">{formatCLP(orderTotal(selectedOrder))}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span className="text-xs font-bold uppercase tracking-widest">Propina (Sugerida 10%)</span>
                    <span className="text-sm font-black font-mono">{formatCLP(orderTotal(selectedOrder) * 0.1)}</span>
                  </div>
                  <div className="h-px bg-emerald-500/20" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-black text-emerald-500 uppercase tracking-widest">Total a Pagar</span>
                    <span className="text-3xl font-black text-emerald-400 tracking-tighter">{formatCLP(orderTotal(selectedOrder) * 1.1)}</span>
                  </div>
                </div>

                {/* Referencia de Baucher */}
                <div className="space-y-2">
                  <label htmlFor="payment_ref" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Referencia de Baucher / Pago</label>
                  <div className="relative group">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                      id="payment_ref"
                      type="text" 
                      placeholder="Ej: #998877"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="w-full bg-background border border-border/10 rounded-2xl p-4 pl-12 focus:outline-none focus:border-emerald-500/50 transition-all font-mono text-sm text-foreground"
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground/60 italic ml-1">Vincule el ticket físico con este registro del sistema.</p>
                </div>
              </div>

              {/* Modal Footer (Action) */}
              <div className="p-8 border-t border-border/10 bg-card/80 backdrop-blur-md">
                <Button
                  onClick={() => markDelivered(selectedOrder)}
                  disabled={isProcessing}
                  className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-2xl shadow-emerald-600/20 gap-3 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Confirmar Pago y Liberar Mesa
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Alert Modal */}
        {alertModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[60] flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-card border border-border/10 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  </div>
                  <h2 className="text-lg font-black tracking-tight text-foreground">Alerta al Admin</h2>
                </div>
                <button onClick={() => setAlertModal(false)} aria-label="Cerrar modal" className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="cashier_table_num" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 block">N° de Mesa (opcional)</label>
                  <input
                    id="cashier_table_num"
                    type="number"
                    placeholder="Ej. 3"
                    value={tableNum}
                    onChange={(e) => setTableNum(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-input border border-border/10 text-foreground text-sm font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="cashier_alert_msg" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 block">Mensaje de Emergencia</label>
                  <textarea
                    id="cashier_alert_msg"
                    rows={3}
                    placeholder="Explica el problema aquí..."
                    value={alertMsg}
                    onChange={(e) => setAlertMsg(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-input border border-border/10 text-foreground text-sm font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setAlertModal(false)} className="flex-1 h-14 rounded-2xl border-white/5 font-black uppercase text-[10px] tracking-widest">Cerrar</Button>
                <Button
                  onClick={handleSendAlert}
                  disabled={!alertMsg.trim() || sendingAlert || alertSent}
                  className="flex-1 h-14 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase text-[10px] tracking-widest shadow-lg shadow-yellow-500/10"
                >
                  {alertSent ? "✓ Enviado" : sendingAlert ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : "Enviar Alerta"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RestaurantThemeProvider>
  );
}
