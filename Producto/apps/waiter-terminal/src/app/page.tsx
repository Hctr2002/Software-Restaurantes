"use client";

import React, { useRef, useEffect } from "react";
import { useAuthStore } from "@menu-bites/store";
import { useTables, useWaiterOrders, updateOrderStatus, signOut } from "@menu-bites/auth";
import { TableGrid, TableCard, Button } from "@menu-bites/ui";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, User, Bell, Clock, CheckCircle2, ChevronRight } from "lucide-react";

const READY_SFX = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

function timeAgo(isoDate: string): string {
  const mins = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000);
  if (mins < 1) return "ahora";
  if (mins === 1) return "1 min";
  return `${mins} min`;
}

export default function WaiterDashboard() {
  const { user, logout: clearAuth } = useAuthStore();
  const { tables, loading } = useTables(user?.restaurantId);
  const { pending, ready }  = useWaiterOrders(user?.restaurantId);
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const prevReadyCount = useRef(0);
  const router = useRouter();

  useEffect(() => {
    if (ready.length > prevReadyCount.current) {
      new Audio(READY_SFX).play().catch(() => {});
    }
    prevReadyCount.current = ready.length;
  }, [ready.length]);

  const handleSignOut = async () => {
    const loginUrl = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000";
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      clearAuth();
      window.location.href = loginUrl;
    }
  };

  const handleConfirm = (orderId: string) => updateOrderStatus(orderId, "VALIDATED");
  const handleDeliver = (orderId: string) => updateOrderStatus(orderId, "DELIVERED");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-8">
      <header className="glass sticky top-0 z-50 p-4 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/20 p-2 rounded-xl">
            <LayoutDashboard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">Terminal de Garzón</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">
              Restaurante ID: {user?.restaurantId?.slice(0, 8)}...
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold">{user?.email}</p>
            <p className="text-[10px] text-primary uppercase font-black">{user?.role}</p>
          </div>
          {ready.length > 0 && (
            <div className="relative">
              <Bell className="w-5 h-5 text-emerald-400 animate-bounce" />
              <span className="absolute -top-1 -right-1 bg-emerald-500 text-black text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {ready.length}
              </span>
            </div>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="rounded-xl bg-white/5 border-white/5 hover:bg-destructive/20 hover:text-destructive hover:border-destructive/20 transition-all"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 space-y-10">

        {/* ── LISTOS PARA RETIRAR ──────────────────────────────────── */}
        {ready.length > 0 && (
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <Bell className="w-5 h-5 text-emerald-400 animate-bounce" />
              <h2 className="text-xl font-black tracking-tighter">Listos para Retirar</h2>
              <span className="bg-emerald-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                {ready.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ready.map((order) => (
                <div
                  key={order.id}
                  className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3 animate-in fade-in duration-300"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-400 font-black text-lg">
                      Mesa {order.table?.number}
                    </span>
                    <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                      {timeAgo(order.created_at)}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {order.items?.map((item: any, i: number) => (
                      <li key={i} className="text-xs text-white/70 flex items-center space-x-2">
                        <span className="text-emerald-400 font-black">x{item.quantity}</span>
                        <span>{item.menu_item?.name}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleDeliver(order.id)}
                    className="w-full py-3 bg-emerald-500 text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-emerald-400 active:scale-95 transition-all flex items-center justify-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Marcar Entregado</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── PENDIENTES DE CONFIRMACIÓN ───────────────────────────── */}
        {pending.length > 0 && (
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-black tracking-tighter">Pendientes de Confirmación</h2>
              <span className="bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                {pending.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pending.map((order) => (
                <div
                  key={order.id}
                  className="p-5 bg-white/5 border border-yellow-500/20 rounded-2xl space-y-3 animate-in fade-in duration-300"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-400 font-black text-lg">
                      Mesa {order.table?.number}
                    </span>
                    <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                      {timeAgo(order.created_at)}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {order.items?.map((item: any, i: number) => (
                      <li key={i} className="text-xs text-white/70 flex items-center space-x-2">
                        <span className="text-yellow-400 font-black">x{item.quantity}</span>
                        <span>{item.menu_item?.name}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleConfirm(order.id)}
                    className="w-full py-3 bg-yellow-500/20 text-yellow-400 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-yellow-500/30 active:scale-95 transition-all border border-yellow-500/20 flex items-center justify-center space-x-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>Confirmar a Cocina</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── SELECCIÓN DE MESA ────────────────────────────────────── */}
        <section>
          <div className="flex flex-col space-y-2 mb-4">
            <h2 className="text-3xl font-black tracking-tighter">Selección de Mesa</h2>
            <p className="text-muted-foreground text-sm font-medium">
              Selecciona una mesa libre para tomar un nuevo pedido.
            </p>
          </div>

          <TableGrid>
            {tables.map((table) => (
              <TableCard
                key={table.id}
                number={table.number}
                status={table.status}
                label={table.label}
                onClick={() => router.push(`/tables/${table.id}/menu?number=${table.number}`)}
              />
            ))}
          </TableGrid>

          {tables.length === 0 && (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <User className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
              <p className="text-muted-foreground font-medium">No hay mesas configuradas aún.</p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
