/**
 * useOrders — Hook de gestión de pedidos con suscripción Realtime a la tabla orders.
 * Carga las órdenes desde /api/local/orders y se sincroniza automáticamente via Supabase.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase, Order, OrderStatus } from "@menu-bites/auth";

/**
 * Provee lista filtrable de órdenes, selección de detalle y actualización de estado.
 * Side effect: suscripción Realtime al canal "orders_changes" durante el montaje.
 */
export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/local/orders", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error cargando órdenes");
      setOrders(json.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    
    // Suscripción Realtime
    const channel = supabase
      .channel('orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/local/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error actualizando estado");
      
      // Update local state if needed (though fetchOrders will be triggered by supabase)
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredOrders = filterStatus === "ALL"
    ? orders
    : orders.filter((o) => o.status === filterStatus);

  return {
    orders,
    filteredOrders,
    loading,
    error,
    filterStatus,
    setFilterStatus,
    selectedOrder,
    setSelectedOrder,
    updatingStatus,
    fetchOrders,
    handleStatusChange,
  };
}
