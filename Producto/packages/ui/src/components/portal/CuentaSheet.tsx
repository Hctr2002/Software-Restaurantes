"use client";

import { ClipboardList, X } from "lucide-react";
import { Order } from "@menu-bites/auth";

interface Props {
  tableNumber: number;
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
};

const STATUS_CLASS: Record<string, string> = {
  READY:     "bg-emerald-500/20 text-emerald-400",
  PREPARING: "bg-primary/20 text-primary",
  VALIDATED: "bg-blue-500/20 text-blue-400",
  PENDING:   "bg-sand/10 text-sand/50",
};

export function CuentaSheet({ tableNumber, orders, onClose }: Props) {
  const total = orders.reduce(
    (s, o) => s + (o.orderItems?.reduce((si, i) => si + Number(i.unitPrice) * i.quantity, 0) || 0),
    0,
  );

  return (
    <div className="fixed inset-0 z-[70] animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-navy-dark/80 backdrop-blur-md" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 glass-panel rounded-t-[2.5rem] p-6 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-sand flex items-center gap-2">
            <ClipboardList className="text-sage w-5 h-5" />
            Mi Cuenta — Mesa {tableNumber}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-sand/10 transition-colors">
            <X className="w-4 h-4 text-sand/60" />
          </button>
        </div>

        {orders.length === 0 ? (
          <p className="text-center text-sand/40 py-8 text-sm">No hay pedidos activos.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => (
              <div key={order.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-sand/40 uppercase tracking-widest">Pedido {i + 1}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${STATUS_CLASS[order.status] ?? "bg-sand/10 text-sand/50"}`}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </div>
                {order.orderItems?.map((item, j) => (
                  <div key={j} className="flex justify-between items-center text-sm">
                    <span className="text-sand/70">
                      <span className="font-bold text-sand/50 mr-2">{item.quantity}×</span>
                      {item.menuItem?.name ?? "Item"}
                    </span>
                    <span className="text-sand font-bold">
                      {formatCLP(Number(item.unitPrice) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="font-bold text-sand">Total acumulado</span>
              <span className="text-xl font-black text-sage">{formatCLP(total)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
