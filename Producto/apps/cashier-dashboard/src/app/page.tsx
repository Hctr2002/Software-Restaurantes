"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@menu-bites/store";
import { supabase, signOut, sendAlert } from "@menu-bites/auth";
import { Badge, Button } from "@menu-bites/ui";
import {
  Receipt, LogOut, CheckCircle, Loader2, AlertTriangle, X, RefreshCw, User,
} from "lucide-react";

type OrderItem = { id: string; quantity: number; unit_price: number; menu_items: { name: string } | null };
type Order = {
  id: string;
  status: string;
  createdAt: string;
  total_amount: number;
  tables: { number: number } | null;
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
  const { user, logout: clearAuth } = useAuthStore();
  const [orders, setOrders]       = useState<Order[]>([]);
  const [loading, setLoading]     = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMsg, setAlertMsg]   = useState("");
  const [tableNum, setTableNum]   = useState("");
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!user?.restaurantId) return;
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("id, status, createdAt, total_amount, tables(number), users(email), order_items(id, quantity, unit_price, menu_items(name))")
      .eq("restaurant_id", user.restaurantId)
      .eq("status", "READY")
      .order("createdAt", { ascending: true });
    setOrders((data as any) || []);
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

  const markDelivered = async (orderId: string) => {
    setProcessing(orderId);
    await supabase.from("orders").update({ status: "DELIVERED" }).eq("id", orderId);
    setProcessing(null);
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
      window.location.href = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000";
    }
  };

  const totalPending = orders.reduce((s, o) => s + orderTotal(o), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100">Terminal de Caja</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Menu Bites · Cajero</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium text-slate-300">{user?.email}</p>
            <p className="text-[10px] text-emerald-400 uppercase font-bold">CAJERO</p>
          </div>

          <button
            onClick={fetchOrders}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setAlertModal(true)}
            className="rounded-xl border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
            title="Enviar alerta al administrador"
          >
            <AlertTriangle className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="rounded-xl"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* KPI bar */}
      <div className="border-b border-slate-800 px-6 py-3 flex items-center gap-6 bg-slate-900/50">
        <div className="text-sm">
          <span className="text-slate-400">Por cobrar: </span>
          <span className="font-bold text-emerald-400">{orders.length} pedido{orders.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="text-sm">
          <span className="text-slate-400">Total pendiente: </span>
          <span className="font-bold text-slate-100">{formatCLP(totalPending)}</span>
        </div>
      </div>

      {/* Orders list */}
      <main className="flex-1 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-600">
            <CheckCircle className="w-12 h-12" />
            <p className="text-sm font-medium">Sin pedidos listos por cobrar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {orders.map((order) => {
              const total   = orderTotal(order);
              const isProc  = processing === order.id;
              return (
                <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col">
                  {/* Mesa + tiempo */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-black text-slate-100">
                        Mesa {order.tables?.number ?? "S/N"}
                      </p>
                      {order.users?.email && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" />
                          {order.users.email.split("@")[0]}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{timeAgo(order.createdAt)}</span>
                      <Badge variant="success">LISTO</Badge>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-1.5 flex-1">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-slate-400">
                          <span className="text-slate-500 font-mono">{item.quantity}×</span>{" "}
                          {item.menu_items?.name ?? "Item"}
                        </span>
                        <span className="text-slate-300 font-mono">
                          {formatCLP(Number(item.unit_price) * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total + cobrar */}
                  <div className="border-t border-slate-800 pt-3 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</span>
                      <span className="text-xl font-black text-emerald-400">{formatCLP(total)}</span>
                    </div>
                    <Button
                      onClick={() => markDelivered(order.id)}
                      disabled={isProc}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2"
                    >
                      {isProc ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Cobrado — Marcar entregado
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal de alerta */}
      {alertModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" /> Enviar Alerta al Admin
              </h2>
              <button onClick={() => setAlertModal(false)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">N° de Mesa (opcional)</label>
                <input
                  type="number"
                  min={1}
                  placeholder="Ej. 3"
                  value={tableNum}
                  onChange={(e) => setTableNum(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mensaje *</label>
                <textarea
                  rows={3}
                  placeholder="Ej. Mesa 3 no quiere pagar, hay discrepancia en la cuenta..."
                  value={alertMsg}
                  onChange={(e) => setAlertMsg(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setAlertModal(false)} className="flex-1">Cancelar</Button>
              <Button
                onClick={handleSendAlert}
                disabled={!alertMsg.trim() || sendingAlert || alertSent}
                className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-black font-bold"
              >
                {alertSent ? "✓ Enviado" : sendingAlert ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar Alerta"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
