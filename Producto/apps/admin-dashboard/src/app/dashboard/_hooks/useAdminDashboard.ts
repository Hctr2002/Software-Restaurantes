"use client";

import React from "react";
import { Restaurant, UserRecord } from "../_components/adminShared";

/**
 * useAdminDashboard: Hook personalizado para la gestión de datos del panel de administración.
 * 
 * Centraliza la lógica de sincronización de datos de restaurantes y usuarios,
 * permitiendo que los componentes de la vista se mantengan puros y enfocados en la UI.
 */
export function useAdminDashboard() {
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

  // Métricas calculadas
  const metrics = React.useMemo(() => {
    const active = restaurants.filter((r) => r.status === "ACTIVE").length;
    const suspended = restaurants.filter((r) => r.status === "SUSPENDED").length;
    const assigned = users.filter((u) => !!u.restaurant_id).length;
    const admins = users.filter((u) => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length;

    return {
      active,
      suspended,
      assigned,
      admins,
      totalRestaurants: restaurants.length,
      totalUsers: users.length,
    };
  }, [restaurants, users]);

  return {
    restaurants,
    users,
    metrics,
    loading,
    error,
    refresh: fetchData,
  };
}
