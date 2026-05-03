"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@menu-bites/ui";
import { Store, Users, Activity, ShieldAlert, UserCheck } from "lucide-react";
import DashboardShell from "./_components/DashboardShell";
import { formatDate, Restaurant, UserRecord } from "./_components/adminShared";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const [restaurants, setRestaurants] = React.useState<Restaurant[]>([]);
  const [users, setUsers] = React.useState<UserRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [restaurantsRes, usersRes] = await Promise.all([
        fetch("/api/admin/restaurants", { cache: "no-store" }),
        fetch("/api/admin/users", { cache: "no-store" }),
      ]);

      const restaurantsJson = await restaurantsRes.json();
      const usersJson = await usersRes.json();

      if (!restaurantsRes.ok) throw new Error(restaurantsJson.error || "Error cargando restaurantes");
      if (!usersRes.ok) throw new Error(usersJson.error || "Error cargando usuarios");

      setRestaurants(restaurantsJson.data || []);
      setUsers(usersJson.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const latestRestaurants = restaurants.slice(0, 10);
  const latestUsers = users.slice(0, 10);

  const restaurantsActive = restaurants.filter((restaurant) => restaurant.status === "ACTIVE").length;
  const restaurantsSuspended = restaurants.filter((restaurant) => restaurant.status === "SUSPENDED").length;
  const usersWithRestaurant = users.filter((userRow) => !!userRow.restaurant_id).length;
  const adminUsers = users.filter((userRow) => userRow.role === "ADMIN" || userRow.role === "SUPER_ADMIN").length;
 
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } }
  };

  return (
    <DashboardShell title="Panel Principal" subtitle="Resumen">
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold">
          {error}
        </div>
      )}

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6"
      >
        <motion.div variants={itemVariants}>
          <KpiCard label="Organizaciones" value={restaurants.length} detail={`${restaurantsActive} activas`} icon={<Store className="w-4 h-4" />} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard label="Suspendidas" value={restaurantsSuspended} detail="Requieren atención" icon={<ShieldAlert className="w-4 h-4 text-destructive" />} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard label="Usuarios" value={users.length} detail={`${adminUsers} privilegios admin`} icon={<Users className="w-4 h-4" />} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KpiCard label="Asignados" value={usersWithRestaurant} detail="Con restaurante" icon={<UserCheck className="w-4 h-4 text-primary" />} />
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-4">
        <Card className="border-white/5 bg-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden group">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <div className="p-2 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                <Store className="w-5 h-5 text-primary" />
              </div>
              Últimas Organizaciones
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">Registros más recientes en la plataforma</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestRestaurants.length === 0 && (
              <p className="text-sm text-slate-500 italic">Aún no existen organizaciones registradas.</p>
            )}
            {latestRestaurants.map((restaurant) => (
              <motion.div 
                whileHover={{ x: 6 }}
                key={restaurant.id} 
                className="p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors flex justify-between items-center"
              >
                <div>
                  <p className="font-black text-white text-sm tracking-tight">{restaurant.name}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{restaurant.slug}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-tighter ${restaurant.status === 'ACTIVE' ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                    {restaurant.status}
                  </span>
                  <p className="text-[9px] text-slate-600 font-bold mt-1 uppercase">{formatDate(restaurant.createdAt)}</p>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden group">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <div className="p-2 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 text-primary" />
              </div>
              Últimos Usuarios
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">Altas más recientes en el sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestUsers.length === 0 && (
              <p className="text-sm text-slate-500 italic">Aún no existen usuarios registrados.</p>
            )}
            {latestUsers.map((userRow) => {
              const restaurantName = Array.isArray(userRow.restaurants)
                ? userRow.restaurants[0]?.name
                : userRow.restaurants?.name;

              return (
                <motion.div 
                  whileHover={{ x: 6 }}
                  key={userRow.id} 
                  className="p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors flex justify-between items-center"
                >
                  <div>
                    <p className="font-black text-white text-sm tracking-tight">{userRow.email}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{userRow.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-primary truncate max-w-[120px]">{restaurantName || "Sin Org."}</p>
                    <p className="text-[9px] text-slate-600 font-bold mt-1 uppercase">{formatDate(userRow.createdAt)}</p>
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {loading && (
        <div className="flex items-center gap-3 mt-8 text-primary font-bold uppercase tracking-widest text-[10px]">
          <Activity className="w-4 h-4 animate-pulse" />
          Sincronizando datos...
        </div>
      )}
    </DashboardShell>
  );
}

function KpiCard({ label, value, detail, icon }: { label: string; value: number; detail: string; icon: React.ReactNode }) {
  return (
    <Card className="border-white/5 bg-white/5 backdrop-blur-xl rounded-[2.5rem] hover:bg-white/10 transition-all duration-500 group overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity group-hover:scale-150 transition-transform duration-700">
        {icon}
      </div>
      <CardContent className="pt-8 px-8 pb-8 relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            {React.isValidElement(icon) 
              ? React.cloneElement(icon as React.ReactElement<any>, { className: "w-3 h-3 text-primary" })
              : icon
            }
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">{label}</p>
        </div>
        <p className="text-4xl font-black tracking-tighter text-white">{value}</p>
        <p className="text-[10px] font-bold text-slate-600 mt-2 uppercase tracking-widest">{detail}</p>
      </CardContent>
    </Card>
  );
}
