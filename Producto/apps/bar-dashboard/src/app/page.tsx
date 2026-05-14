"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@menu-bites/store";
import { useBarOrders, updateOrderStatus, signOut, useThemeSync } from "@menu-bites/auth";
import { OrderTicket, Button, RestaurantThemeProvider, KDSColumn, TicketWrapper, PremiumHeader, HeaderStat, cn } from "@menu-bites/ui";
import { GlassWater, Bell, Settings, LogOut, AlertTriangle, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";


import dynamic from "next/dynamic";
import { StockAlertModal } from "./_components/StockAlertModal";
import { SettingsErrorBoundary } from "./_components/ErrorBoundary";
import { loadSettings, saveSettings, getTicketUrgency, DEFAULT_SETTINGS, type KDSSettings } from "../lib/kdsSettings";

const SettingsModal = dynamic(
  () => import("./_components/SettingsModal").then((m) => ({ default: m.SettingsModal })),
  { ssr: false }
);

const NEW_TICKET_SFX = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";
const CRITICAL_SFX   = "https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3";

function playSound(url: string) { new Audio(url).play().catch(() => {}); }

export default function BarDashboardPage() {
  const { user, logout: clearAuth } = useAuthStore();
  const { orders: liveOrders, loading: liveLoading, refetch } = useBarOrders(user?.restaurantId);
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
  const [mounted, setMounted] = useState(false);
  const [activeCol, setActiveCol] = useState("preparing");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !user) router.replace("/login");
  }, [mounted, user, router]);

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
      const { error } = await updateOrderStatus(orderId, newStatus);
      if (error) {
        alert(`Error al actualizar el pedido: ${error.message}`);
        return;
      }
      refetch();

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
    { key: "pending", title: "Nuevos", orders: pendingOrders, icon: null, active: activeCol === "pending" },
    { key: "preparing", title: "Barra", orders: preparingOrders, icon: null, active: activeCol === "preparing" },
    { key: "ready", title: "Listos", orders: readyOrders, icon: null, active: activeCol === "ready" },
  ];

  if (!mounted || !user || liveLoading) {
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
          title="BAR"
          accentTitle="MONITOR"
          icon={GlassWater}
          statusSubLabel="EN BARRA"
          stats={
            <>
              <HeaderStat label="Nuevos" value={pendingOrders.length} color="text-foreground/40" />
              <HeaderStat label="En Barra"  value={preparingOrders.length} color="text-purple-400" />
              <HeaderStat label="Listos"    value={readyOrders.length} color="text-emerald-500" />
            </>
          }
          actions={
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                onClick={() => setAlertOpen(true)}
                className="rounded-2xl h-12 sm:h-14 px-2 sm:px-8 border-yellow-500/10 bg-yellow-500/5 text-yellow-500 hover:bg-yellow-500/10 hover:border-yellow-500/30 gap-1.5 font-black uppercase tracking-widest text-[10px] transition-all duration-300"
              >
                <AlertTriangle className="w-5 h-5" />
                <span className="hidden md:inline">Alerta Stock</span>
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-2xl w-12 h-12 sm:w-14 sm:h-14 border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300" 
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-foreground/40" />
              </Button>
              <Button 
                variant="destructive" 
                size="icon" 
                onClick={handleSignOut} 
                disabled={isSigningOut} 
                className="rounded-2xl w-12 h-12 sm:w-14 sm:h-14 bg-red-600 text-white shadow-2xl shadow-red-900/40 hover:bg-red-700 hover:scale-105 active:scale-95 transition-all duration-300"
              >
                <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </div>
          }
        />

        {/* Mobile Tab System */}
        <div className="md:hidden px-4 py-2">
          <div className="flex p-1 bg-card/60 backdrop-blur-md rounded-2xl border border-foreground/10 gap-1">
            {columns.map((col) => (
              <button
                key={col.key}
                onClick={() => setActiveCol(col.key)}
                className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all ${
                  activeCol === col.key ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground"
                }`}
              >
                <div className="relative px-2">
                  <span className="text-[10px] font-black uppercase tracking-widest">{col.title}</span>
                  {col.orders.length > 0 && (
                    <span className="absolute -top-3 -right-3 flex h-5 w-5 items-center justify-center bg-red-600 text-white rounded-full text-[10px] font-black border-2 border-card shadow-md">
                      {col.orders.length}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
          <AnimatePresence mode="popLayout">
            {columns.map((col) => (
              <div key={col.key} className={cn("h-full", activeCol !== col.key && "hidden md:block")}>
                <KDSColumn title={col.title} count={col.orders.length} icon={col.icon} active={col.active}>
                  {col.orders.map((order) => (
                    <TicketWrapper key={`${col.key}-${order.id}`} createdAt={order.createdAt} thresholds={settings.thresholds} status={order.status}>
                      <OrderTicket type="BAR" id={order.id} tableNumber={order.table?.number ?? 0} status={order.status} createdAt={order.createdAt} items={order.orderItems || []} notes={order.notes} onStatusChange={(s) => handleStatusChange(order.id, s)} onDismiss={() => setClearedOrders((prev) => new Set([...prev, order.id]))} />
                    </TicketWrapper>
                  ))}
                </KDSColumn>
              </div>
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
          <SettingsErrorBoundary>
            <SettingsModal
              settings={settings}
              restaurantId={user?.restaurantId}
              userId={user?.id}
              onSave={handleSaveSettings}
              onClose={() => setSettingsOpen(false)}
            />
          </SettingsErrorBoundary>
        )}
      </div>
    </RestaurantThemeProvider>
  );
}
