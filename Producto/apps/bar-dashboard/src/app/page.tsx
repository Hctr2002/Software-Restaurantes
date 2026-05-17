"use client";

/**
 * BarDashboardPage: Monitor premium para la gestión de pedidos de barra.
 * 
 * Implementa una arquitectura de columnas KDS (Kitchen Display System) con
 * efectos de Glassmorphism, alertas sonoras y sincronización en tiempo real.
 */

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@menu-bites/store";
import { useBarOrders, updateOrderStatus, signOut } from "@menu-bites/auth";
import { OrderTicket, Button, KDSColumn, TicketWrapper, PremiumHeader, HeaderStat, cn } from "@menu-bites/ui";
import { GlassWater, Settings, LogOut, AlertTriangle, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import dynamic from "next/dynamic";
import { StockAlertModal } from "./_components/StockAlertModal";
import { SettingsErrorBoundary } from "./_components/ErrorBoundary";
import { loadSettings, saveSettings, DEFAULT_SETTINGS, type KDSSettings } from "../lib/kdsSettings";
import { useMonitorNotifications } from "../hooks/useMonitorNotifications";

const SettingsModal = dynamic(
  () => import("./_components/SettingsModal").then((m) => ({ default: m.SettingsModal })),
  { ssr: false }
);

export default function BarDashboardPage() {
  const { user, logout: clearAuth } = useAuthStore();
  const { orders: liveOrders, loading: liveLoading, refetch } = useBarOrders(user?.restaurantId);
  
  // Estados de UI y configuración
  const [clearedOrders, setClearedOrders] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<KDSSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [tick, setTick] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [activeCol, setActiveCol] = useState("preparing");

  const autoClearTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const router = useRouter();

  // Filtrado de pedidos activos (no despachados manualmente)
  const orders = liveOrders.filter((o) => !clearedOrders.has(o.id));

  // Inicialización y hidratación
  useEffect(() => { setMounted(true); }, []);

  // Redirección de seguridad
  useEffect(() => {
    if (mounted && !user) router.replace("/login");
  }, [mounted, user, router]);

  // Carga de configuración persistente
  useEffect(() => { loadSettings().then(setSettings); }, []);
  
  // Reloj interno para refrescar urgencia de tickets
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Gestión de notificaciones y sonidos vía Hook dedicado
  useMonitorNotifications({ 
    ordersCount: orders.length, 
    orders, 
    settings, 
    tick 
  });

  // Handlers de negocio
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await updateOrderStatus(orderId, newStatus);
      if (error) throw error;
      refetch();

      if (newStatus === "READY" && settings.autoClear.enabled) {
        const timer = setTimeout(() => 
          setClearedOrders((prev) => new Set([...prev, orderId])), 
          settings.autoClear.delaySeconds * 1000
        );
        autoClearTimers.current.set(orderId, timer);
      }
    } catch (err) {
      console.error("Error al actualizar pedido:", err);
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

  // Clasificación de pedidos por columna
  const pendingOrders   = orders.filter((o) => o.status === "VALIDATED");
  const preparingOrders = orders.filter((o) => o.status === "PREPARING");
  const readyOrders     = orders.filter((o) => o.status === "READY");

  const columns = [
    { key: "pending", title: "Nuevos", orders: pendingOrders, active: activeCol === "pending" },
    { key: "preparing", title: "Barra", orders: preparingOrders, active: activeCol === "preparing" },
    { key: "ready", title: "Listos", orders: readyOrders, active: activeCol === "ready" },
  ];

  if (!mounted || !user || liveLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="h-24 w-24 rounded-3xl bg-primary/20 flex items-center justify-center"
        >
          <Activity className="h-10 w-10 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bar-gradient text-foreground overflow-hidden flex flex-col p-4 lg:p-6 gap-6 selection:bg-primary/30">
      
      {/* Cabecera Premium con Glassmorphism */}
      <PremiumHeader
        title="BAR"
        accentTitle="MONITOR"
        icon={GlassWater}
        statusSubLabel="OPERACIÓN ACTIVA"
        stats={
          <div className="flex items-center gap-6">
            <HeaderStat label="Nuevos" value={pendingOrders.length} color="text-foreground/40" />
            <HeaderStat label="En Barra" value={preparingOrders.length} color="text-primary" />
            <HeaderStat label="Listos" value={readyOrders.length} color="text-success" />
          </div>
        }
        actions={
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              onClick={() => setAlertOpen(true)}
              className="rounded-2xl h-12 sm:h-14 px-2 sm:px-8 border-primary/10 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/30 gap-1.5 font-black uppercase tracking-widest text-[10px]"
            >
              <AlertTriangle className="w-5 h-5" />
              <span className="hidden md:inline">Alerta Stock</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-2xl w-12 h-12 sm:w-14 sm:h-14 border-foreground/5 bg-foreground/5 hover:bg-foreground/10" 
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-foreground/40" />
            </Button>
            
            <Button 
              variant="destructive" 
              size="icon" 
              onClick={handleSignOut} 
              disabled={isSigningOut} 
              className="rounded-2xl w-12 h-12 sm:w-14 sm:h-14 shadow-2xl shadow-destructive/20"
            >
              <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
          </div>
        }
      />

      {/* Navegación Mobile-First */}
      <div className="md:hidden">
        <div className="flex p-1 bg-card border border-border/40 rounded-2xl gap-1 shadow-lg">
          {columns.map((col) => (
            <button
              key={col.key}
              onClick={() => setActiveCol(col.key)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-500",
                activeCol === col.key ? "bg-primary text-primary-foreground shadow-xl" : "text-muted-foreground hover:bg-foreground/5"
              )}
            >
              <span className="text-[10px] font-black uppercase tracking-widest relative">
                {col.title}
                {col.orders.length > 0 && (
                  <span className="absolute -top-1 -right-3 w-1.5 h-1.5 bg-destructive rounded-full" />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Columnas Pro Max */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {columns.map((col) => (
            <motion.div 
              key={col.key} 
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn("h-full", activeCol !== col.key && "hidden md:block")}
            >
              <KDSColumn title={col.title} count={col.orders.length} active={col.active}>
                <div className="flex flex-col gap-4 pb-12">
                  {col.orders.map((order) => (
                    <TicketWrapper 
                      key={`${col.key}-${order.id}`} 
                      createdAt={order.createdAt} 
                      thresholds={settings.thresholds} 
                      status={order.status}
                    >
                      <OrderTicket 
                        type="BAR" 
                        id={order.id} 
                        tableNumber={order.table?.number ?? 0} 
                        status={order.status} 
                        createdAt={order.createdAt} 
                        items={order.orderItems || []} 
                        notes={order.notes} 
                        onStatusChange={(s) => handleStatusChange(order.id, s)} 
                        onDismiss={() => setClearedOrders((prev) => new Set([...prev, order.id]))} 
                      />
                    </TicketWrapper>
                  ))}
                </div>
              </KDSColumn>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {/* Modales Reactivos */}
      <AnimatePresence>
        {alertOpen && (
          <StockAlertModal
            restaurantId={user?.restaurantId}
            userId={user?.id}
            userEmail={user?.email}
            onClose={() => setAlertOpen(false)}
          />
        )}
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
      </AnimatePresence>

      {/* Indicador de conexión */}
      <div className="fixed bottom-6 left-6 flex items-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[9px] font-black uppercase tracking-tighter">Real-time Stream Active</span>
      </div>

    </div>
  );
}
