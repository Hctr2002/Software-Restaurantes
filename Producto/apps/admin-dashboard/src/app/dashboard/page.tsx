"use client";

/**
 * DashboardPage: Vista principal del panel de administración global.
 * 
 * Este componente implementa un resumen ejecutivo (KPIs) y un diseño de Bento Grid
 * para la actividad reciente, aplicando estándares de diseño sólido premium.
 */

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@menu-bites/ui";
import { Store, Users, Activity, ShieldAlert, UserCheck, ArrowUpRight, Zap } from "lucide-react";
import DashboardShell from "./_components/DashboardShell";
import { formatDate } from "./_components/adminShared";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminDashboard } from "./_hooks/useAdminDashboard";

export default function DashboardPage() {
  const { restaurants, users, metrics, loading, error } = useAdminDashboard();

  // Obtener los datos más recientes para el Bento Grid
  const latestRestaurants = restaurants.slice(0, 6);
  const latestUsers = users.slice(0, 5);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }
  };

  return (
    <DashboardShell title="Principal" subtitle="Resumen">
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-2xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold mb-6 flex items-center gap-3"
          >
            <Zap className="w-4 h-4" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid de KPIs Superiores */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <KpiCard 
          label="Organizaciones" 
          value={metrics.totalRestaurants} 
          detail={`${metrics.active} activas`} 
          icon={<Store />} 
          variant="primary"
        />
        <KpiCard 
          label="Alertas Críticas" 
          value={metrics.suspended} 
          detail="Requieren revisión" 
          icon={<ShieldAlert />} 
          variant="destructive"
        />
        <KpiCard 
          label="Usuarios Globales" 
          value={metrics.totalUsers} 
          detail={`${metrics.admins} administradores`} 
          icon={<Users />} 
          variant="primary"
        />
        <KpiCard 
          label="Tasa de Adopción" 
          value={metrics.assigned} 
          detail="Usuarios vinculados" 
          icon={<UserCheck />} 
          variant="primary"
        />
      </motion.div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(200px,auto)]">
        
        {/* Celda Grande: Organizaciones (Ocupa 2 cols x 2 rows en desktop) */}
        <Card className="md:col-span-2 md:row-span-2 border-border bg-card rounded-[2.5rem] overflow-hidden group shadow-2xl shadow-black/5 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-xl font-black flex items-center gap-3">
                <Store className="w-6 h-6 text-primary" />
                Control de Marcas
              </CardTitle>
              <CardDescription className="font-medium">Gestión de despliegues activos</CardDescription>
            </div>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 bg-primary/10 rounded-full text-primary"
            >
              <ArrowUpRight className="w-5 h-5" />
            </motion.button>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto px-6 pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {latestRestaurants.map((res) => (
                <motion.div 
                  key={res.id}
                  layout
                  whileHover={{ y: -4, backgroundColor: "hsl(var(--muted)/0.5)" }}
                  className="p-5 rounded-3xl border border-border bg-muted/30 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-black text-base truncate">{res.name}</p>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${res.status === 'ACTIVE' ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                      {res.status}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{res.slug}</p>
                  <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground/50 border-t border-border pt-3">
                    <span>{formatDate(res.createdAt)}</span>
                    <Zap className="w-3 h-3 text-primary/40" />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Celda Media: Usuarios Recientes */}
        <Card className="md:col-span-1 border-border bg-card rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/5">
          <CardHeader>
            <CardTitle className="text-lg font-black flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              Staff Reciente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            {latestUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-xs group-hover:scale-110 transition-transform">
                  {user.email.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{user.email}</p>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase">{user.role}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Celda Pequeña: Estado del Sistema */}
        <Card className="md:col-span-1 border-primary/20 bg-card rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/5 flex flex-col justify-center items-center p-8 text-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-16 h-16 rounded-3xl bg-primary/20 flex items-center justify-center mb-4"
          >
            <Activity className="w-8 h-8 text-primary" />
          </motion.div>
          <h3 className="font-black text-lg mb-1">Sistema Óptimo</h3>
          <p className="text-xs text-muted-foreground font-medium mb-4">Latencia: 24ms | Uptime: 99.9%</p>
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "95%" }}
              className="h-full bg-primary"
            />
          </div>
        </Card>

      </div>

      {loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-8 right-8 flex items-center gap-3 px-6 py-3 bg-card border border-border rounded-full shadow-2xl z-50"
        >
          <Activity className="w-4 h-4 text-primary animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Sincronizando...</span>
        </motion.div>
      )}
    </DashboardShell>
  );
}

function KpiCard({ label, value, detail, icon, variant = "primary" }: {
  label: string;
  value: number;
  detail: string;
  icon: React.ReactElement<{ className?: string }>;
  variant?: "primary" | "destructive";
}) {
  return (
    <motion.div whileHover={{ y: -5 }}>
      <Card className="border-border bg-card hover:bg-muted/30 transition-all duration-500 group overflow-hidden relative shadow-lg shadow-black/5 h-full">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity group-hover:scale-150 transition-transform duration-700">
          {React.cloneElement(icon as React.ReactElement<any>, { className: "w-16 h-16" })}
        </div>
        
        <CardContent className="pt-8 px-6 pb-8 relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-2 rounded-xl ${variant === "primary" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
              {React.cloneElement(icon as React.ReactElement<any>, { className: "w-4 h-4" })}
            </div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-black">{label}</p>
          </div>
          
          <p className="text-4xl font-black tracking-tighter text-foreground mb-1">{value}</p>
          <p className={`text-[10px] font-bold mt-1 uppercase tracking-wider ${variant === "primary" ? "text-primary/60" : "text-destructive/60"}`}>
            {detail}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
