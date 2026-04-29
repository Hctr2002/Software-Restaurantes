"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@menu-bites/ui";
import { Store, Users } from "lucide-react";
import DashboardShell from "./_components/DashboardShell";
import { formatDate, Restaurant, UserRecord } from "./_components/adminShared";

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

  return (
    <DashboardShell title="Panel Principal" subtitle="Resumen">
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Organizaciones Totales" value={restaurants.length} detail={`${restaurantsActive} activos`} />
        <KpiCard label="Organizaciones Suspendidas" value={restaurantsSuspended} detail="Estado SUSPENDED" />
        <KpiCard label="Usuarios Totales" value={users.length} detail={`${adminUsers} admins/super admins`} />
        <KpiCard label="Usuarios Asignados" value={usersWithRestaurant} detail="Con organización asociada" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <Card className="border-white/5 bg-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Store className="w-5 h-5" /> Últimas 10 Organizaciones</CardTitle>
            <CardDescription>Registros más recientes creados en la plataforma</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestRestaurants.length === 0 && (
              <p className="text-sm text-muted-foreground">Aún no existen organizaciones registradas.</p>
            )}
            {latestRestaurants.map((restaurant) => (
              <div key={restaurant.id} className="p-3 rounded-xl border border-white/10 bg-black/20">
                <p className="font-bold text-sm">{restaurant.name}</p>
                <p className="text-xs text-muted-foreground">{restaurant.slug} - {restaurant.status}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{formatDate(restaurant.createdAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-white/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Últimos 10 Usuarios</CardTitle>
            <CardDescription>Altas más recientes de usuarios del sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestUsers.length === 0 && (
              <p className="text-sm text-muted-foreground">Aún no existen usuarios registrados.</p>
            )}
            {latestUsers.map((userRow) => {
              const restaurantName = Array.isArray(userRow.restaurants)
                ? userRow.restaurants[0]?.name
                : userRow.restaurants?.name;

              return (
                <div key={userRow.id} className="p-3 rounded-xl border border-white/10 bg-black/20">
                  <p className="font-bold text-sm">{userRow.email}</p>
                  <p className="text-xs text-muted-foreground">{userRow.role} - {restaurantName || "Sin organización"}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{formatDate(userRow.createdAt)}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Cargando datos de administracion...</p>
      )}
    </DashboardShell>
  );
}

function KpiCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <Card className="border-white/5 bg-white/5 backdrop-blur-md">
      <CardContent className="pt-6">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</p>
        <p className="text-3xl font-black tracking-tight mt-1">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{detail}</p>
      </CardContent>
    </Card>
  );
}
