import React from "react";
import { Modal, Badge, Button } from "@menu-bites/ui";
import { Loader2, Clock } from "lucide-react";
import { formatDate, formatPrice, timeAgo, Order, OrderStatus } from "../../_components/localShared";
import { orderStatusVariant, orderTotal } from "./OrderTable";

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
  updatingStatus: boolean;
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "VALIDATED",
  VALIDATED: "PREPARING",
  PREPARING: "READY",
  READY: "DELIVERED",
};

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onStatusChange,
  updatingStatus,
}: OrderDetailModalProps) {
  if (!order) return null;

  const nextStatus = NEXT_STATUS[order.status];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalle — Mesa ${order.tables?.number ?? "S/N"}`}
      footer={
        nextStatus ? (
          <>
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-foreground/50 hover:bg-white/5 hover:text-foreground rounded-xl font-bold uppercase tracking-widest text-[10px]"
            >
              Cerrar
            </Button>
            <Button
              onClick={() => onStatusChange(order.id, nextStatus)}
              disabled={updatingStatus}
              className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl font-bold uppercase tracking-widest text-[10px] px-6 shadow-lg shadow-primary/20 transition-all"
            >
              {updatingStatus ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                `Avanzar a ${nextStatus}`
              )}
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-foreground/50 hover:bg-white/5 hover:text-foreground rounded-xl font-bold uppercase tracking-widest text-[10px]"
          >
            Cerrar
          </Button>
        )
      }
    >
      <div className="space-y-8 py-4">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
          <Badge
            variant={orderStatusVariant(order.status)}
            className="px-4 py-1 text-[10px] font-black uppercase tracking-widest"
          >
            {order.status}
          </Badge>
          <div className="flex items-center gap-2 text-[10px] font-bold text-foreground/30 uppercase tracking-widest">
            <Clock className="w-3.5 h-3.5" />
            {timeAgo(order.createdAt)}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] px-1">
            Items de la Orden
          </p>
          <div className="space-y-2">
            {(order.order_items ?? []).map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-primary/20 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs italic">
                    {item.quantity ?? 1}x
                  </div>
                  <span className="text-sm font-bold text-foreground uppercase italic tracking-tight">
                    {item.menu_items?.name ?? "Item"}
                  </span>
                </div>
                <span className="text-sm font-black text-foreground/60">
                  {formatPrice(Number(item.unitPrice ?? 0) * (item.quantity ?? 1))}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-[2rem] bg-primary/10 border border-primary/20 flex justify-between items-center shadow-xl shadow-primary/5">
          <span className="text-[11px] font-black text-primary uppercase tracking-[0.3em]">
            Total del Pedido
          </span>
          <span className="text-3xl font-black text-primary italic leading-none">
            {formatPrice(orderTotal(order))}
          </span>
        </div>

        <div className="text-center">
          <p className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest">
            Registrado el {formatDate(order.createdAt)}
          </p>
        </div>
      </div>
    </Modal>
  );
}
