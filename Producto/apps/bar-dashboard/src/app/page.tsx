"use client";

import { useEffect, useRef, useState } from "react";
// Rebuild trigger: 2026-05-07T06:09:40Z
import { useAuthStore } from "@menu-bites/store";
import { useBarOrders, updateOrderStatus, signOut, useThemeSync } from "@menu-bites/auth";
import { OrderTicket, Button, RestaurantThemeProvider, KDSColumn, TicketWrapper, PremiumHeader, HeaderStat } from "@menu-bites/ui";
import { GlassWater, Bell, Settings, LogOut, AlertTriangle, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";


import { SettingsModal } from "./_components/SettingsModal";
import { StockAlertModal } from "./_components/StockAlertModal";
import { loadSettings, saveSettings, getTicketUrgency, DEFAULT_SETTINGS, type KDSSettings } from "../lib/kdsSettings";

const NEW_TICKET_SFX = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";
const CRITICAL_SFX   = "https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3";

function playSound(url: string) { new Audio(url).play().catch(() => {}); }

export default function BarDashboardPage() {
  const { user, logout: clearAuth } = useAuthStore();
  const { orders: liveOrders, loading: liveLoading } = useBarOrders(user?.restaurantId);
  const [clearedOrders, setClearedOrders] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<KDSSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const theme = useThemeSync(user?.restaurantId, "kds");
  const [tick, setTick] = useState(0);

  const prevCount       = useRef(0);
  const criticalAlerted = useRef<Set<string>>(new Set());
  const autoClearTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const router          = useRouter();

  const orders    = liveOrders.filter((o) => !clearedOrders.has(o.id));
  const loading   = liveLoading;

  useEffect(() => { loadSettings().then(setSettings); }, []);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (orders.length > prevCount.current && settings.sounds.newTicket) playSound(NEW_TICKET_SFX);
    prevCount.current = orders.length;
  }, [orders.length, settings.sounds.newTicket]);

  useEffect(() => {
    if (!settings.sounds.criticalAlert) return;
    orders.forEach((order) => {
      if (["VALIDATED", "READY", "DELIVERED"].includes(order.status)) return;
      const urgency = getTicketUrgency(order.createdAt, settings.thresholds);
      if (urgency === "red" && !criticalAlerted.current.has(order.id)) {
        criticalAlerted.current.add(order.id);
        playSound(CRITICAL_SFX);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, orders.length, settings.sounds.criticalAlert, settings.thresholds]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await updateOrderStatus(orderId, newStatus, 'BAR');
      if (error) {
        alert(`Error al actualizar el pedido: ${error.message}`);
        return;
      }
  
      if (newStatus === "READY" && settings.autoClear.enabled) {
        const timer = setTimeout(() => setClearedOrders((prev) => new Set([...prev, orderId])), settings.autoClear.delaySeconds * 1000);
        autoClearTimers.current.set(orderId, timer);
      }
    } catch (err) {
      alert("Ocurrió un error inesperado al procesar el cambio de estado.");
    }
  };

  const handleSaveSettings = async (s: KDSSettings) => {
    setSettings(s);
    await saveSettings(s);
    setSettingsOpen(false);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try { await signOut(); } finally {
      clearAuth();
      router.refresh();
      window.location.href = process.env.NEXT_PUBLIC_AUTH_URL || "/";
    }
  };

  const pendingOrders   = orders.filter((o) => o.status === "VALIDATED");
  const preparingOrders = orders.filter((o) => o.status === "PREPARING");
  const readyOrders     = orders.filter((o) => o.status === "READY");

  const columns = [
    { key: "pending", title: "Pedidos Nuevos", orders: pendingOrders, icon: <Bell className="w-5 h-5 text-muted-foreground" />, active: false },
    { key: "preparing", title: "En Barra", orders: preparingOrders, icon: <GlassWater className="w-5 h-5 text-primary" />, active: true },
    { key: "ready", title: "Para Despacho", orders: readyOrders, icon: <Activity className="w-5 h-5 text-emerald-500" />, active: false },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-primary shadow-2xl shadow-primary/20" />
      </div>
    );
  }

  return (
    <RestaurantThemeProvider theme={theme ?? undefined} isGlobal>
      <div className="min-h-screen bar-gradient text-foreground overflow-hidden flex flex-col p-4 lg:p-6 gap-6">
        <PremiumHeader
          title="Bar"
          accentTitle="Monitor"
          icon={GlassWater}
          statusSubLabel="Drink Station"
          stats={
            <>
              <HeaderStat label="Recibidos" value={pendingOrders.length} color="text-foreground/50" />
              <HeaderStat label="En Barra"  value={preparingOrders.length} color="text-primary" />
              <HeaderStat label="Listos"    value={readyOrders.length} color="text-emerald-500" />
            </>
          }
          actions={
            <>
              <Button variant="outline" onClick={() => setAlertOpen(true)}
                className="rounded-2xl h-14 px-8 border-yellow-500/20 bg-yellow-500/5 text-yellow-500 hover:bg-yellow-500/10 hover:border-yellow-500/40 gap-3 font-black uppercase tracking-widest text-[10px]">
                <AlertTriangle className="w-5 h-5" />
                Alerta Stock
              </Button>
              <Button variant="outline" size="icon" className="rounded-2xl w-14 h-14" onClick={() => setSettingsOpen(true)}>
                <Settings className="w-6 h-6 text-muted-foreground" />
              </Button>
              <Button variant="destructive" size="icon" onClick={handleSignOut} disabled={isSigningOut} className="rounded-2xl w-14 h-14 shadow-xl shadow-destructive/20">
                <LogOut className="w-6 h-6" />
              </Button>
            </>
          }
        />

        <main className="flex-1 grid grid-cols-3 gap-6 overflow-hidden">
          <AnimatePresence mode="popLayout">
            {columns.map((col) => (
              <KDSColumn key={col.key} title={col.title} count={col.orders.length} icon={col.icon} active={col.active}>
                {col.orders.map((order) => (
                  <TicketWrapper key={`${col.key}-${order.id}`} createdAt={order.createdAt} thresholds={settings.thresholds} status={order.status}>
                    <OrderTicket type="BAR" id={order.id} tableNumber={order.table?.number ?? 0} status={order.status} createdAt={order.createdAt} items={order.orderItems || []} onStatusChange={(s) => handleStatusChange(order.id, s)} />
                  </TicketWrapper>
                ))}
              </KDSColumn>
            ))}
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {alertOpen && (
            <StockAlertModal
              restaurantId={user?.restaurantId}
              userId={user?.id}
              userEmail={user?.email}
              onClose={() => setAlertOpen(false)}
            />
          )}
        </AnimatePresence>

        {settingsOpen && (
          <SettingsModal
            settings={settings}
            restaurantId={user?.restaurantId}
            onSave={handleSaveSettings}
            onClose={() => setSettingsOpen(false)}
          />
        )}
      </div>
    </RestaurantThemeProvider>
  );
}
