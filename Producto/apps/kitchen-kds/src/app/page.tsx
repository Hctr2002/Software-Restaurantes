"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@menu-bites/store";
import { useKitchenOrders, updateOrderStatus, signOut } from "@menu-bites/auth";
import { OrderTicket, cn, Button } from "@menu-bites/ui";
import { ChefHat, Bell, Settings, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { MOCK_ORDERS, type MockOrder } from "../lib/mock-orders";
import { SettingsModal } from "./_components/SettingsModal";
import {
  loadSettings,
  saveSettings,
  getTicketUrgency,
  DEFAULT_SETTINGS,
  type KDSSettings,
} from "../lib/kdsSettings";

const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

const URGENCY_RING: Record<"green" | "yellow" | "red", string> = {
  green:  "ring-2 ring-emerald-500/30",
  yellow: "ring-2 ring-yellow-500/50 shadow-md shadow-yellow-500/10",
  red:    "ring-2 ring-red-500/60 shadow-lg shadow-red-500/20",
};

const NEW_TICKET_SFX  = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";
const CRITICAL_SFX    = "https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3";

function playSound(url: string) {
  new Audio(url).play().catch(() => {});
}

export default function KitchenKDSPage() {
  const { user, logout: clearAuth } = useAuthStore();
  const { orders: liveOrders, loading: liveLoading } = useKitchenOrders(
    MOCK_MODE ? undefined : user?.restaurantId
  );
  const [mockOrders, setMockOrders] = useState<MockOrder[]>(MOCK_ORDERS);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<KDSSettings>(DEFAULT_SETTINGS);
  const [clearedOrders, setClearedOrders] = useState<Set<string>>(new Set());
  const [tick, setTick] = useState(0);

  const prevOrdersCount = useRef(0);
  const autoClearTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const criticalAlerted = useRef<Set<string>>(new Set());
  const router = useRouter();

  // Load settings from localStorage on mount
  useEffect(() => { setSettings(loadSettings()); }, []);

  // Tick every 30s to refresh color coding and check critical alerts
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const rawOrders = MOCK_MODE ? mockOrders : liveOrders;
  const orders = rawOrders.filter(o => !clearedOrders.has(o.id));
  const loading = MOCK_MODE ? false : liveLoading;

  // New ticket sound
  useEffect(() => {
    if (orders.length > prevOrdersCount.current && settings.sounds.newTicket) {
      playSound(NEW_TICKET_SFX);
    }
    prevOrdersCount.current = orders.length;
  }, [orders.length]);

  // Critical sound alert — triggered on tick and when orders change
  useEffect(() => {
    if (!settings.sounds.criticalAlert) return;
    orders.forEach(order => {
      if (order.status === "READY" || order.status === "DELIVERED") return;
      const urgency = getTicketUrgency(order.created_at, settings.thresholds);
      if (urgency === "red" && !criticalAlerted.current.has(order.id)) {
        criticalAlerted.current.add(order.id);
        playSound(CRITICAL_SFX);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, orders.length]);

  const handleSignOut = async () => {
    const loginUrl = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000";
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      clearAuth();
      router.refresh();
      window.location.href = loginUrl;
      setIsSigningOut(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (MOCK_MODE) {
      setMockOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status: newStatus as MockOrder["status"] } : o)
      );
    } else {
      // State machine: PENDING → PREPARING is invalid — must go through VALIDATED first
      const order = orders.find(o => o.id === orderId);
      if (order?.status === "PENDING" && newStatus === "PREPARING") {
        const { error } = await updateOrderStatus(orderId, "VALIDATED");
        if (error) return;
      }
      await updateOrderStatus(orderId, newStatus);
    }

    if (newStatus === "READY" && settings.autoClear.enabled) {
      const timer = setTimeout(() => {
        setClearedOrders(prev => new Set([...prev, orderId]));
      }, settings.autoClear.delaySeconds * 1000);
      autoClearTimers.current.set(orderId, timer);
    }
  };

  const handleSaveSettings = (s: KDSSettings) => {
    setSettings(s);
    saveSettings(s);
    setSettingsOpen(false);
  };

  // PENDING = recién creado por el garzón; VALIDATED = ya confirmado, esperando inicio
  const pendingOrders   = orders.filter(o => o.status === "PENDING" || o.status === "VALIDATED");
  const preparingOrders = orders.filter(o => o.status === "PREPARING");
  const readyOrders     = orders.filter(o => o.status === "READY");

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
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">
              Kitchen <span className="text-primary">Monitor</span>
            </h1>
            <div className="flex items-center space-x-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
              <span className="text-emerald-500">● Online</span>
              <span>•</span>
              <span>{MOCK_MODE ? "Modo Demo" : "Estación Principal"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-8 px-6 py-2 bg-white/5 rounded-2xl border border-white/5">
            <Stat label="Pendientes"  value={pendingOrders.length}   color="text-slate-400" />
            <Stat label="En Fuego"    value={preparingOrders.length} color="text-primary" />
            <Stat label="Listos"      value={readyOrders.length}     color="text-emerald-500" />
          </div>
          <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setSettingsOpen(true)}>
            <Settings className="w-5 h-5 text-muted-foreground" />
          </Button>
          <Button variant="destructive" size="icon" onClick={handleSignOut} disabled={isSigningOut} className="rounded-xl">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-3 gap-6 overflow-hidden">
        <KDSColumn title="Nuevos Pedidos" count={pendingOrders.length} icon={<Bell className="w-4 h-4 text-slate-400" />}>
          {pendingOrders.map(order => (
            <TicketWrapper key={order.id} createdAt={order.created_at} thresholds={settings.thresholds} status={order.status}>
              <OrderTicket
                id={order.id}
                tableNumber={order.table.number}
                status={order.status}
                createdAt={order.created_at}
                items={order.items}
                onStatusChange={s => handleStatusChange(order.id, s)}
              />
            </TicketWrapper>
          ))}
        </KDSColumn>

        <KDSColumn title="En Preparación" count={preparingOrders.length} icon={<ChefHat className="w-4 h-4 text-primary" />} active>
          {preparingOrders.map(order => (
            <TicketWrapper key={order.id} createdAt={order.created_at} thresholds={settings.thresholds} status={order.status}>
              <OrderTicket
                id={order.id}
                tableNumber={order.table.number}
                status={order.status}
                createdAt={order.created_at}
                items={order.items}
                onStatusChange={s => handleStatusChange(order.id, s)}
              />
            </TicketWrapper>
          ))}
        </KDSColumn>

        <KDSColumn title="Por Entregar" count={readyOrders.length} icon={<Bell className="w-4 h-4 text-emerald-500" />}>
          {readyOrders.map(order => (
            <TicketWrapper key={order.id} createdAt={order.created_at} thresholds={settings.thresholds} status={order.status}>
              <OrderTicket
                id={order.id}
                tableNumber={order.table.number}
                status={order.status}
                createdAt={order.created_at}
                items={order.items}
                onStatusChange={s => handleStatusChange(order.id, s)}
              />
            </TicketWrapper>
          ))}
        </KDSColumn>
      </main>

      {settingsOpen && (
        <SettingsModal
          settings={settings}
          restaurantId={user?.restaurantId}
          onSave={handleSaveSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

function TicketWrapper({ createdAt, thresholds, status, children }: {
  createdAt: string;
  thresholds: KDSSettings["thresholds"];
  status: string;
  children: React.ReactNode;
}) {
  const urgency = status === "READY" ? "green" : getTicketUrgency(createdAt, thresholds);
  return (
    <div className={cn("rounded-[2.5rem]", URGENCY_RING[urgency])}>
      {children}
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

function KDSColumn({ title, count, icon, children, active }: {
  title: string; count: number; icon: React.ReactNode; children: React.ReactNode; active?: boolean;
}) {
  return (
    <div className={cn(
      "flex flex-col h-full bg-black/20 rounded-[2.5rem] border border-white/5 overflow-hidden",
      active && "bg-primary/5 border-primary/10"
    )}>
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
          <div className="h-full flex items-center justify-center opacity-20 italic text-sm">
            Sin órdenes activas
          </div>
        )}
      </div>
    </div>
  );
}
