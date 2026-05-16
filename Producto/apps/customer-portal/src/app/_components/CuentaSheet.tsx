"use client";

import { ClipboardList, X } from "lucide-react";
interface OrderItem {
  quantity: number;
  unit_price: number;
  menu_item: { name: string } | null;
}

interface TableOrder {
  id: string;
  status: string;
  total_amount: number;
  createdAt: string;
  items: OrderItem[];
}

interface Props {
  tableNumber: number;
  orders: TableOrder[];
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
  READY:     "bg-success/20 text-success",
  PREPARING: "bg-primary/20 text-primary",
  VALIDATED: "bg-blue-500/20 text-blue-400",
  PENDING:   "bg-foreground/10 text-foreground/50",
};

export function CuentaSheet({ tableNumber, orders, onClose }: Props) {
  const total = orders.reduce(
    (s, o) => s + (o.items?.reduce((si, i) => si + Number(i.unit_price) * i.quantity, 0) || 0),
    0,
  );

  return (
    <div className="fixed inset-0 z-[70] animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-background/95" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 glass-premium rounded-t-[2.5rem] p-6 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 border-t border-foreground/10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="text-primary w-5 h-5" />
            Mi Cuenta — Mesa {tableNumber}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-foreground/10 transition-colors">
            <X className="w-4 h-4 text-foreground/60" />
          </button>
        </div>

        {orders.length === 0 ? (
          <p className="text-center text-foreground/40 py-8 text-sm">No hay pedidos activos.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => (
              <div key={order.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-foreground/40 uppercase tracking-widest">Pedido {i + 1}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${STATUS_CLASS[order.status] ?? "bg-foreground/10 text-foreground/50"}`}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </div>
                {order.items?.map((item, j) => (
                  <div key={j} className="flex justify-between items-center text-sm">
                    <span className="text-foreground/70">
                      <span className="font-bold text-foreground/50 mr-2">{item.quantity}×</span>
                      {item.menu_item?.name ?? "Item"}
                    </span>
                    <span className="text-foreground font-bold">
                      {formatCLP(Number(item.unit_price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
            <div className="pt-4 border-t border-foreground/10 flex justify-between items-center">
              <span className="font-bold text-foreground">Total acumulado</span>
              <span className="text-xl font-black text-primary">{formatCLP(total)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
