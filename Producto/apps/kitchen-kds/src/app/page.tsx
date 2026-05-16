"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@menu-bites/store";
import { useKitchenOrders, updateOrderStatus, signOut } from "@menu-bites/auth";
import { OrderTicket, Button, KDSColumn, TicketWrapper, PremiumHeader, HeaderStat } from "@menu-bites/ui";
import { ChefHat, Settings, LogOut, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";

// Importación de componentes locales y lógica de configuración
import { SettingsModal } from "./_components/SettingsModal";
import { StockAlertModal } from "./_components/StockAlertModal";
import { loadSettings, saveSettings, getTicketUrgency, DEFAULT_SETTINGS, type KDSSettings } from "../lib/kdsSettings";

// Recursos de audio para notificaciones de cocina
const NEW_TICKET_SFX = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";
const CRITICAL_SFX   = "https://assets.mixkit.co/active_storage/sfx/2997/2997-preview.mp3";

/**
 * Función auxiliar para reproducir efectos de sonido.
 */
function playSound(url: string) { new Audio(url).play().catch(() => {}); }

/**
 * KitchenKDSPage - Componente principal del monitor de cocina.
 * Gestiona el flujo de pedidos desde su recepción hasta que están listos para servicio.
 */
export default function KitchenKDSPage() {
  const {
    user,
    loading,
    mounted,
    settings,
    settingsOpen,
    setSettingsOpen,
    alertOpen,
    setAlertOpen,
    isSigningOut,
    activeCol,
    setActiveCol,
    pendingOrders,
    preparingOrders,
    readyOrders,
    handleStatusChange,
    handleSaveSettings,
    handleSignOut,
    setClearedOrders
  } = useKitchenDashboard();

  const router = useRouter();

  // Protección de ruta
  useEffect(() => {
    if (mounted && !user) router.replace("/login");
  }, [mounted, user, router]);

  const columns = [
    { key: "pending", title: "Nuevos", orders: pendingOrders, icon: null, active: false },
    { key: "preparing", title: "Cocina", orders: preparingOrders, icon: null, active: true },
    { key: "ready", title: "Listos", orders: readyOrders, icon: null, active: false },
  ];

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-primary shadow-2xl shadow-primary/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen wow-gradient text-foreground overflow-hidden flex flex-col font-sans selection:bg-primary/30">
      {/* Cabecera Premium: Foco en herencia de color primario y fondos semánticos */}
      <div className="p-4 sm:p-6 pt-6 sm:pt-8 pb-0">
        <PremiumHeader
          title="Kitchen"
          accentTitle="Monitor"
          icon={ChefHat}
          statusSubLabel="Estación Central"
          stats={
            <div className="hidden sm:flex items-center gap-6">
              <HeaderStat label="Recibidos" value={pendingOrders.length} color="text-foreground/50" />
              <HeaderStat label="En Preparación" value={preparingOrders.length} color="text-primary" />
              <HeaderStat label="Listos" value={readyOrders.length} color="text-success" />
            </div>
          }
          actions={
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                onClick={() => setAlertOpen(true)}
                className="rounded-2xl h-12 sm:h-14 px-2 sm:px-8 border-warning/10 bg-warning/5 text-warning hover:bg-warning/10 hover:border-warning/30 gap-1.5 font-black uppercase tracking-widest text-[10px] transition-all duration-300"
              >
                <AlertTriangle className="w-5 h-5" />
                <span className="hidden md:inline">Alerta Stock</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-2xl w-12 h-12 sm:w-14 sm:h-14 border-border bg-muted/30 hover:bg-muted/50 transition-all duration-300 group" 
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-foreground/40 group-hover:rotate-90 transition-transform duration-500" />
              </Button>
              
              <Button 
                variant="destructive" 
                size="icon" 
                onClick={handleSignOut} 
                disabled={isSigningOut} 
                className="rounded-2xl w-12 h-12 sm:w-14 sm:h-14 shadow-2xl shadow-destructive/20 transition-all duration-300 border-none group"
              >
                <LogOut className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          }
        />
      </div>

      {/* Navegación por Pestañas (Mobile): Diseño Sólido Premium */}
      <div className="md:hidden px-4 py-2">
        <div className="flex p-1 bg-card border border-border rounded-2xl gap-1 shadow-lg">
          {columns.map((col) => (
            <button
              key={col.key}
              onClick={() => setActiveCol(col.key)}
              className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all duration-300 ${
                activeCol === col.key 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
                  : "text-foreground/40 hover:bg-muted/30"
              }`}
            >
              <div className="relative px-2">
                <span className="text-[10px] font-black uppercase tracking-widest">{col.title}</span>
                {col.orders.length > 0 && (
                  <span className="absolute -top-3 -right-3 flex h-5 w-5 items-center justify-center bg-destructive text-destructive-foreground rounded-full text-[10px] font-black border-2 border-background shadow-md">
                    {col.orders.length}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Área Principal: Grid de columnas con herencia de tema en bordes y sombras */}
      <main className="flex-1 p-4 sm:p-6 overflow-hidden">
        <div className="h-full grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <AnimatePresence mode="popLayout">
            {columns.map((col) => (
              <div 
                key={col.key} 
                className={cn(
                  "h-full transition-all duration-500",
                  activeCol === col.key ? "block translate-y-0 opacity-100" : "hidden md:block translate-y-4 md:translate-y-0 opacity-0 md:opacity-100"
                )}
              >
                <KDSColumn 
                  title={col.title} 
                  count={col.orders.length} 
                  icon={col.icon} 
                  active={col.active}
                  className="shadow-xl"
                >
                  {col.orders.map((order) => (
                    <TicketWrapper 
                      key={`${col.key}-${order.id}`} 
                      createdAt={order.createdAt} 
                      thresholds={settings.thresholds} 
                      status={order.status}
                    >
                      <OrderTicket 
                        type="KITCHEN" 
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
                </KDSColumn>
              </div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Modales de Interacción: Diseño Sólido Premium */}
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
  );
}

