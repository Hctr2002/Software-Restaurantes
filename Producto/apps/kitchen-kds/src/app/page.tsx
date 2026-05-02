"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@menu-bites/store";
import { useKitchenOrders, updateOrderStatus, signOut, sendAlert } from "@menu-bites/auth";
import { OrderTicket, cn, Button } from "@menu-bites/ui";
import { ChefHat, Bell, Settings, LogOut, AlertTriangle, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { MOCK_ORDERS, type MockOrder } from "../lib/mock-orders";

const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

export default function KitchenKDSPage() {
  const { user, logout: clearAuth } = useAuthStore();
  const { orders: liveOrders, loading: liveLoading } = useKitchenOrders(
    MOCK_MODE ? undefined : user?.restaurantId
  );
  const [mockOrders, setMockOrders] = useState<MockOrder[]>(MOCK_ORDERS);
  const prevOrdersCount = useRef(0);
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [alertItem, setAlertItem] = useState("");
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const router = useRouter();

  const orders = MOCK_MODE ? mockOrders : liveOrders;
  const loading = MOCK_MODE ? false : liveLoading;

  const handleSignOut = async () => {
    const loginUrl = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000";
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      clearAuth();
      router.refresh();
      window.location.href = loginUrl;
    }
  };

  useEffect(() => {
    if (orders.length > prevOrdersCount.current) {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.play().catch(() => {});
    }
    prevOrdersCount.current = orders.length;
  }, [orders.length]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (MOCK_MODE) {
      setMockOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as MockOrder["status"] } : o))
      );
      return;
    }
    await updateOrderStatus(orderId, newStatus);
  };

  const handleSendAlert = async () => {
    if (!alertMsg.trim() || !user?.restaurantId) return;
    setSendingAlert(true);
    const { error } = await sendAlert({
      restaurantId: user.restaurantId,
      userId: user.id,
      userEmail: user.email,
      type: "STOCK_SHORTAGE",
      message: alertMsg.trim(),
      menuItemName: alertItem.trim() || undefined,
    });
    setSendingAlert(false);
    if (!error) {
      setAlertSent(true);
      setTimeout(() => {
        setAlertSent(false);
        setAlertModal(false);
        setAlertMsg("");
        setAlertItem("");
      }, 1500);
    }
  };

  const pendingOrders   = orders.filter((o) => o.status === "PENDING");
  const preparingOrders = orders.filter((o) => o.status === "PREPARING");
  const readyOrders     = orders.filter((o) => o.status === "READY");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary shadow-2xl shadow-primary/20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden flex flex-col">
      <header className="bg-black/40 backdrop-blur-xl border-b border-white/5 p-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <ChefHat className="text-primary-foreground w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">Kitchen <span className="text-primary">Monitor</span></h1>
            <div className="flex items-center space-x-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
              <span className="text-emerald-500">● Online</span>
              <span>•</span>
              <span>{MOCK_MODE ? "Modo Demo" : "Estación Principal"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-8 px-6 py-2 bg-white/5 rounded-2xl border border-white/5">
            <Stat label="Pendientes"  value={pendingOrders.length}   color="text-slate-400" />
            <Stat label="En Fuego"    value={preparingOrders.length} color="text-primary" />
            <Stat label="Listos"      value={readyOrders.length}     color="text-emerald-500" />
          </div>

          {/* Botón de alerta de stock */}
          <Button
            variant="outline"
            onClick={() => setAlertModal(true)}
            disabled={MOCK_MODE}
            className="rounded-xl border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Alerta Stock
          </Button>

          <Button variant="destructive" size="icon" onClick={handleSignOut} disabled={isSigningOut || MOCK_MODE} className="rounded-xl">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-3 gap-6 overflow-hidden">
        <KDSColumn title="Nuevos Pedidos"  count={pendingOrders.length}   icon={<Bell className="w-4 h-4 text-slate-400" />}>
          {pendingOrders.map((order) => (
            <OrderTicket key={order.id} id={order.id} tableNumber={order.table.number} status={order.status} createdAt={order.created_at} items={order.items} onStatusChange={(s) => handleStatusChange(order.id, s)} />
          ))}
        </KDSColumn>
        <KDSColumn title="En Preparación" count={preparingOrders.length} icon={<ChefHat className="w-4 h-4 text-primary" />} active>
          {preparingOrders.map((order) => (
            <OrderTicket key={order.id} id={order.id} tableNumber={order.table.number} status={order.status} createdAt={order.created_at} items={order.items} onStatusChange={(s) => handleStatusChange(order.id, s)} />
          ))}
        </KDSColumn>
        <KDSColumn title="Por Entregar"   count={readyOrders.length}     icon={<Bell className="w-4 h-4 text-emerald-500" />}>
          {readyOrders.map((order) => (
            <OrderTicket key={order.id} id={order.id} tableNumber={order.table.number} status={order.status} createdAt={order.created_at} items={order.items} onStatusChange={(s) => handleStatusChange(order.id, s)} />
          ))}
        </KDSColumn>
      </main>

      {/* Modal de alerta de stock */}
      {alertModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" /> Alerta de Quiebre de Stock
              </h2>
              <button onClick={() => setAlertModal(false)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Plato / Ingrediente afectado</label>
                <input
                  type="text"
                  placeholder="Ej. Tomate, Lomo a la plancha..."
                  value={alertItem}
                  onChange={(e) => setAlertItem(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mensaje *</label>
                <textarea
                  rows={3}
                  placeholder="Describe el problema de stock..."
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
                className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-black font-bold gap-2"
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

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{label}</p>
      <p className={cn("text-xl font-black", color)}>{value}</p>
    </div>
  );
}

function KDSColumn({ title, count, icon, children, active }: { title: string; count: number; icon: React.ReactNode; children: React.ReactNode; active?: boolean }) {
  return (
    <div className={cn("flex flex-col h-full bg-black/20 rounded-[2.5rem] border border-white/5 overflow-hidden", active && "bg-primary/5 border-primary/10")}>
      <div className="p-6 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center space-x-3">
          {icon}
          <h3 className="font-bold text-sm uppercase tracking-widest">{title}</h3>
        </div>
        <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-black">{count}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {children}
        {count === 0 && (
          <div className="h-full flex items-center justify-center opacity-20 italic text-sm">Sin órdenes activas</div>
        )}
      </div>
    </div>
  );
}
