import React from "react";
import { Badge } from "@menu-bites/ui";
import { User, Clock, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { formatPrice, timeAgo, Order } from "../../_components/localShared";
import { orderStatusVariant, orderTotal, garzonLabel } from "./OrderTable";

interface OrderMobileListProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
}

export function OrderMobileList({ orders, onSelectOrder }: OrderMobileListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:hidden">
      {orders.length === 0 && (
        <div className="py-12 text-center glass rounded-[2.5rem] border-foreground/5">
          <p className="text-foreground/40 font-bold uppercase tracking-widest text-[10px]">No se encontraron pedidos.</p>
        </div>
      )}
      {orders.map((order) => (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={order.id}
          className="glass p-6 rounded-[2rem] border-foreground/5 space-y-4 relative overflow-hidden"
          onClick={() => onSelectOrder(order)}
        >
          <div className="flex justify-between items-start relative z-10">
            <div>
              <h3 className="font-black text-foreground text-lg tracking-tight uppercase italic leading-none mb-1">Mesa {order.tables?.number ?? "S/N"}</h3>
              <div className="flex items-center gap-2 text-[10px] font-bold text-foreground/30 uppercase tracking-widest">
                <User className="w-3 h-3" />
                <span>{garzonLabel(order)}</span>
                <span className="text-foreground/10">•</span>
                <Clock className="w-3 h-3" />
                <span>{timeAgo(order.createdAt)}</span>
              </div>
            </div>
            <Badge variant={orderStatusVariant(order.status)} className="px-3 py-1 text-[9px] font-black uppercase tracking-widest">
              {order.status === "COMPLETED" ? "PAGADO" : order.status}
            </Badge>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-foreground/5">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-black text-foreground/60 uppercase tracking-widest">{order.order_items?.length ?? 0} Items</span>
            </div>
            <span className="text-lg font-black text-primary">{formatPrice(orderTotal(order))}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
