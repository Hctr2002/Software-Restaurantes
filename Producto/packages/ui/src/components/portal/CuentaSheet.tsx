"use client";

import { ClipboardList, X } from "lucide-react";
import { Order } from "@menu-bites/auth";

interface Props {
  tableLabel: string;
  orders: Order[];
  onClose: () => void;
}

function formatCLP(n: number) {
  return `$${n.toLocaleString("es-CL")}`;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING:   "Solicitado",
  VALIDATED: "Confirmado",
  PREPARING: "En preparación",
  READY:     "🍽️ Listo",
  DELIVERED: "Entregado",
  COMPLETED: "Completado",
};

const STATUS_CLASS: Record<string, string> = {
  READY:     "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  PREPARING: "bg-primary/20 text-primary border border-primary/30",
  VALIDATED: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  PENDING:   "bg-sand/10 text-sand/50 border border-sand/20",
  DELIVERED: "bg-teal-500/20 text-teal-400 border border-teal-500/30",
  COMPLETED: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
};

export function CuentaSheet({ tableLabel, orders, onClose }: Props) {
  const total = orders.reduce(
    (s, o) => s + (o.orderItems?.reduce((si, i) => si + Number(i.unitPrice) * i.quantity, 0) || 0),
    0,
  );

  // Agrupar pedidos por mesa
  const ordersByTable: Record<string, typeof orders> = {};

  orders.forEach(order => {
    const tableKey = order.tableNumber ? `Mesa ${order.tableNumber}` : "Sin Mesa";
    if (!ordersByTable[tableKey]) ordersByTable[tableKey] = [];
    ordersByTable[tableKey].push(order);
  });

  return (
    <div className="fixed inset-0 z-[70] animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-navy-dark/90 backdrop-blur-xl" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 glass-panel rounded-t-[2.5rem] p-6 h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300 border-t border-white/10 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-sand flex items-center gap-2">
              <ClipboardList className="text-sage w-5 h-5" />
              Mi Cuenta
            </h2>
            <p className="text-xs text-sand/40 mt-0.5">Mesa {tableLabel} · Detalle de consumos</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
            <X className="w-4 h-4 text-sand/60" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-2 -mr-2 space-y-6">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-sand/40 space-y-3">
              <ClipboardList className="w-12 h-12 opacity-20" />
              <p className="text-sm font-medium">No hay pedidos activos en esta sesión.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(ordersByTable).map(([tableKey, tableOrders]) => (
                <div key={tableKey} className="space-y-3">
                  <h3 className="text-sm font-bold text-sand flex items-center gap-2 border-b border-white/5 pb-2">
                    <ClipboardList className="w-4 h-4 text-sage" />
                    {tableKey}
                  </h3>
                  
                  <div className="space-y-4">
                    {tableOrders.map((order) => (
                      <div key={order.id} className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3 hover:bg-white/10 transition-colors duration-300">
                        
                        {/* Order Header */}
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <div>
                            <span className="text-xs font-black text-sand/40 uppercase tracking-widest">Pedido #{orders.length - orders.indexOf(order)}</span>
                            <p className="text-[10px] text-sand/30">
                              {new Date(order.createdAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${STATUS_CLASS[order.status] ?? "bg-sand/10 text-sand/50"}`}>
                            {STATUS_LABEL[order.status] ?? order.status}
                          </span>
                        </div>

                        {/* Items */}
                        <div className="space-y-2 pt-1">
                          {order.orderItems?.map((item, j) => (
                            <div key={j} className="flex justify-between items-center text-sm">
                              <span className="text-sand/80 flex items-center gap-3">
                                <span className="font-bold text-sage bg-sage/10 w-6 h-6 flex items-center justify-center rounded-lg text-xs border border-sage/20">
                                  {item.quantity}
                                </span>
                                <span className="font-medium">{item.menuItem?.name ?? "Item"}</span>
                              </span>
                              <span className="text-sand font-bold">
                                {formatCLP(Number(item.unitPrice) * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Order Subtotal */}
                        <div className="flex justify-between items-center pt-2 border-t border-white/5 text-xs">
                          <span className="text-sand/40 font-medium">Subtotal</span>
                          <span className="text-sand/80 font-bold">
                            {formatCLP(order.orderItems?.reduce((s, item) => s + Number(item.unitPrice) * item.quantity, 0) || 0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Grand Total - Fixed at bottom */}
        {orders.length > 0 && (
          <div className="mt-4 pt-5 border-t border-white/10 flex justify-between items-center bg-navy-dark/50 backdrop-blur-xl -mx-6 px-6 -mb-6 pb-6 rounded-b-[2.5rem] shrink-0">
            <div>
              <span className="font-bold text-sand text-lg block">Total Acumulado</span>
              <span className="text-xs text-sand/40">{orders.length} pedido{orders.length !== 1 ? 's' : ''} en curso</span>
            </div>
            <span className="text-2xl font-black text-sage bg-sage/5 px-4 py-2 rounded-xl border border-sage/10">
              {formatCLP(total)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
