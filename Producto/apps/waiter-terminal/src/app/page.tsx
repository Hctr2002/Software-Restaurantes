"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@menu-bites/store";
import { supabase, useTables, signOut, sendAlert, updateOrderStatus, AlertType, getRestaurantTheme } from "@menu-bites/auth";
import { TableGrid, TableCard, Button, RestaurantThemeProvider } from "@menu-bites/ui";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, User, AlertTriangle, X, Loader2, CheckCircle, XCircle, Receipt, Bell, UtensilsCrossed, Sparkles, MessageSquare } from "lucide-react";

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
  created_at: string;
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
  const [ordersLoading, setOrdersLoading]   = useState(false);
  const [processingId, setProcessingId]     = useState<string | null>(null);

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
      .select("id, status, table_id, total_amount, createdAt, created_at, tables(number), order_items(id, quantity, menu_items(name))")
      .eq("restaurant_id", user.restaurantId)
      .in("status", ["PENDING", "READY"])
      .order("created_at", { ascending: true });

    const rows = (data as any[]) ?? [];
    setPendingOrders(rows.filter((o) => o.status === "PENDING"));
    setReadyOrders(rows.filter((o) => o.status === "READY"));
    setOrdersLoading(false);
  }, [user?.restaurantId]);

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <RestaurantThemeProvider theme={theme} isGlobal={true}>
      <div className="min-h-screen bg-background text-foreground pb-20">
        <header className="glass sticky top-0 z-50 p-4 flex justify-between items-center border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/20 p-2 rounded-xl">
              <LayoutDashboard className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">Terminal de Garzón</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">
                {user?.restaurantId?.slice(0, 8)}...
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold">{user?.email}</p>
              <p className="text-[10px] text-primary uppercase font-black">{user?.role}</p>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setAlertModal(true)}
              aria-label="Enviar alerta al administrador"
              className="rounded-xl bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20"
            >
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleSignOut}
              aria-label="Cerrar sesión de terminal"
              disabled={isSigningOut}
              className="rounded-xl bg-white/5 border-white/5 hover:bg-destructive/20 hover:text-destructive hover:border-destructive/20 transition-all"
            >
              <LogOut className="w-5 h-5" aria-hidden="true" />
            </Button>
          </div>
        </header>

        {/* Tabs */}
        <div className="px-4 pt-4">
          <div className="flex p-1.5 bg-card rounded-2xl border border-border/10 w-fit gap-1">
            <button
              onClick={() => setActiveTab("mesas")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === "mesas"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Mesas
            </button>
            <button
              onClick={() => setActiveTab("pedidos")}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === "pedidos"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bell className="w-4 h-4" />
              Pendientes
              {pendingOrders.length > 0 && (
                <span className="ml-1 bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse">
                  {pendingOrders.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <main className="max-w-7xl mx-auto py-6 px-4 space-y-6">
          {activeTab === "mesas" && (
            <>
              {/* Órdenes listas para servir */}
              {readyOrders.length > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-black text-sm text-emerald-400 uppercase tracking-widest">
                      Listos para servir ({readyOrders.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {readyOrders.map((order) => (
                      <div key={order.id} className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <p className="font-black text-foreground text-sm">
                            Mesa {order.tables?.number ?? "—"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {order.order_items.length} ítem(s)
                          </p>
                        </div>
                        <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg uppercase tracking-wider">
                          LISTO
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mesas en limpieza */}
              {cleaningTables.length > 0 && (
                <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-sky-400" />
                    <h3 className="font-black text-sm text-sky-400 uppercase tracking-widest">
                      Limpieza pendiente ({cleaningTables.length})
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cleaningTables.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleTableClean(t.id)}
                        className="flex items-center gap-2 text-xs font-black text-sky-300 bg-sky-500/10 px-3 py-2 rounded-xl border border-sky-500/20 hover:bg-sky-500/20 transition-all active:scale-95"
                      >
                        Mesa {t.number} — Mesa lista ✓
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Solicitudes de cuenta */}
              {tables.some((t) => t.bill_requested) && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-yellow-400" />
                    <h3 className="font-black text-sm text-yellow-400 uppercase tracking-widest">
                      Cuenta solicitada
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tables.filter((t) => t.bill_requested).map((t) => (
                      <span key={t.id} className="text-xs font-black text-yellow-400 bg-yellow-500/10 px-3 py-1.5 rounded-xl border border-yellow-500/20">
                        Mesa {t.number}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col space-y-2">
                <h2 className="text-3xl font-black tracking-tighter">Selección de Mesa</h2>
                <p className="text-muted-foreground text-sm font-medium">
                  Selecciona una mesa libre para comenzar a tomar el pedido.
                </p>
              </div>

              <TableGrid>
                {tables.map((table) => (
                  <div key={table.id} className="relative">
                    {(billRequestedTableIds.has(table.id) || readyTableIds.has(table.id) || table.status === "CLEANING") && (
                      <div className="absolute -top-2 -right-2 z-10 flex gap-1">
                        {table.status === "CLEANING" && (
                          <span className="bg-sky-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">
                            LIMPIEZA
                          </span>
                        )}
                        {billRequestedTableIds.has(table.id) && (
                          <span className="bg-yellow-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">
                            CUENTA
                          </span>
                        )}
                        {readyTableIds.has(table.id) && (
                          <span className="bg-emerald-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">
                            LISTO
                          </span>
                        )}
                      </div>
                    )}
                    <TableCard
                      number={table.number}
                      status={table.status}
                      label={table.label}
                      onClick={() => router.push(`/tables/${table.id}/menu`)}
                    />
                  </div>
                ))}
              </TableGrid>

              {tables.length === 0 && (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <User className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" aria-hidden="true" />
                  <p className="text-muted-foreground font-medium">No hay mesas configuradas aún.</p>
                </div>
              )}
            </>
          )}

          {activeTab === "pedidos" && (
            <div className="space-y-4">
              <h2 className="text-3xl font-black tracking-tighter">Pedidos Pendientes</h2>
              <p className="text-muted-foreground text-sm font-medium">
                Valida o rechaza los pedidos entrantes del portal del cliente.
              </p>

              {ordersLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary" />
                </div>
              ) : pendingOrders.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <CheckCircle className="w-12 h-12 mx-auto text-emerald-500/20 mb-4" aria-hidden="true" />
                  <p className="text-muted-foreground font-medium">No hay pedidos pendientes de validación.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {pendingOrders.map((order) => (
                    <div key={order.id} className="bg-card border border-border/10 rounded-2xl p-5 flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-black tracking-tighter text-foreground">
                            Mesa {order.tables?.number ?? "—"}
                          </h3>
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                            {order.order_items.length} ítem(s)
                          </p>
                        </div>
                        <span className="text-[9px] font-black text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-lg uppercase tracking-wider">
                          PENDIENTE
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {order.order_items.slice(0, 4).map((item) => (
                          <div key={item.id} className="flex items-center gap-2 text-sm">
                            <span className="w-6 h-6 flex items-center justify-center bg-foreground/5 rounded-lg text-xs font-black text-muted-foreground">
                              {item.quantity}
                            </span>
                            <span className="text-foreground/70 font-medium truncate">
                              {item.menu_items?.name ?? "Item"}
                            </span>
                          </div>
                        ))}
                        {order.order_items.length > 4 && (
                          <p className="text-[10px] text-muted-foreground pl-8">
                            +{order.order_items.length - 4} más
                          </p>
                        )}
                      </div>

                      {/* W2.4: Nota de cocina */}
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          <MessageSquare className="w-3 h-3" />
                          Nota de cocina
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Ej: Sin sal, alergia a mariscos…"
                            value={notesByOrder[order.id] ?? order.order_items[0]?.menu_items?.name ? "" : ""}
                            onChange={(e) => setNotesByOrder((prev) => ({ ...prev, [order.id]: e.target.value }))}
                            className="flex-1 text-xs px-3 py-2 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                          />
                          <button
                            onClick={() => handleSaveNote(order.id)}
                            disabled={savingNoteId === order.id || !notesByOrder[order.id]}
                            className="px-3 py-2 rounded-xl bg-foreground/5 border border-foreground/10 text-xs font-black text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-all disabled:opacity-30"
                          >
                            {savingNoteId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "OK"}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleReject(order)}
                          disabled={processingId === order.id}
                          variant="outline"
                          className="flex-1 h-11 rounded-xl border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 font-black text-xs uppercase tracking-widest gap-2"
                        >
                          {processingId === order.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          Rechazar
                        </Button>
                        <Button
                          onClick={() => handleValidate(order)}
                          disabled={processingId === order.id}
                          className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest gap-2 shadow-lg shadow-emerald-600/20"
                        >
                          {processingId === order.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Validar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        <nav className="fixed bottom-0 inset-x-0 glass border-t border-white/5 p-4 flex justify-around items-center sm:hidden">
          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
            Menú Bites Mobile Terminal
          </span>
        </nav>

        {/* Modal de alerta */}
        {alertModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" aria-hidden="true" /> Enviar Alerta
                </h2>
                <button onClick={() => setAlertModal(false)} aria-label="Cerrar modal" className="p-1 rounded text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {ALERT_OPTIONS.map((opt) => (
                  <button
                    key={opt.type}
                    onClick={() => setAlertType(opt.type)}
                    aria-pressed={alertType === opt.type}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${opt.color} ${alertType === opt.type ? "ring-2 ring-current" : ""}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="table_num" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">N° de Mesa (opcional)</label>
                  <input
                    id="table_num"
                    type="number"
                    min={1}
                    placeholder="Ej. 5"
                    value={tableNum}
                    onChange={(e) => setTableNum(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label htmlFor="alert_msg" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mensaje *</label>
                  <textarea
                    id="alert_msg"
                    rows={3}
                    placeholder="Describe la situación…"
                    value={alertMsg}
                    onChange={(e) => setAlertMsg(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setAlertModal(false)} className="flex-1">Cancelar</Button>
                <Button
                  onClick={handleSendAlert}
                  disabled={!alertMsg.trim() || sendingAlert || alertSent}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-black font-bold gap-2"
                >
                  {alertSent ? "✓ Enviado" : sendingAlert ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : "Enviar"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RestaurantThemeProvider>
  );
}
