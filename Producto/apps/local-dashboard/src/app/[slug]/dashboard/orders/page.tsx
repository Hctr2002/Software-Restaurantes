/**
 * OrdersPage — Vista de gestión de pedidos con filtro por estado y detalle en modal.
 * Se actualiza en tiempo real via suscripción Realtime del hook useOrders.
 */
"use client";

import React from "react";
import LocalShell from "../_components/LocalShell";
import { useOrders } from "@/hooks/useOrders";
import { OrderToolbar } from "./_components/OrderToolbar";
import { OrderTable } from "./_components/OrderTable";
import { OrderMobileList } from "./_components/OrderMobileList";
import { OrderDetailModal } from "./_components/OrderDetailModal";

export default function OrdersPage() {
  const {
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
  } = useOrders();

  return (
    <LocalShell title="Gestión" subtitle="Pedidos">
      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold mb-6">
          {error}
        </div>
      )}

      <OrderToolbar
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        onRefresh={fetchOrders}
      />

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest">
            Sincronizando comandas...
          </p>
        </div>
      ) : (
        <>
          <OrderMobileList
            orders={filteredOrders}
            onSelectOrder={setSelectedOrder}
          />
          <OrderTable
            orders={filteredOrders}
            onSelectOrder={setSelectedOrder}
          />
        </>
      )}

      <OrderDetailModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
        updatingStatus={updatingStatus}
      />
    </LocalShell>
  );
}
