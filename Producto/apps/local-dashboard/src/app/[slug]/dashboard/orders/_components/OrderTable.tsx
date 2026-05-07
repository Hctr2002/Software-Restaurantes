import React from "react";
import { Table, TableRow, TableCell, Badge, Button } from "@menu-bites/ui";
import { User } from "lucide-react";
import { formatDate, formatPrice, Order } from "../../_components/localShared";

interface OrderTableProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
}

type BadgeVariant = "success" | "danger" | "warning" | "neutral" | "info";

export function orderStatusVariant(status: string): BadgeVariant {
  if (status === "PENDING") return "warning";
  if (status === "PREPARING") return "info";
  if (status === "READY") return "success";
  if (status === "COMPLETED") return "success";
  if (status === "DELIVERED") return "neutral";
  return "neutral";
}

export function orderTotal(order: Order): number {
  return (order.order_items ?? []).reduce(
    (sum, item) => sum + Number(item.unitPrice ?? 0) * (item.quantity ?? 1),
    0
  );
}

export function garzonLabel(order: Order): string {
  if (!order.users?.email) return "S/A";
  return order.users.email.split("@")[0];
}

export function OrderTable({ orders, onSelectOrder }: OrderTableProps) {
  return (
    <div className="hidden lg:block">
      <Table headers={["Mesa", "Garzón", "Estado", "Items", "Total", "Fecha", ""]}>
        {orders.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-foreground/40 py-12 font-bold uppercase tracking-widest text-xs">
              No hay pedidos registrados.
            </TableCell>
          </TableRow>
        )}
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-black text-foreground text-sm italic uppercase tracking-tight">
              Mesa {order.tables?.number ?? "S/N"}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2 text-foreground/60 text-[11px] font-bold uppercase tracking-widest">
                <User className="w-3.5 h-3.5 text-primary/40" />
                {garzonLabel(order)}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={orderStatusVariant(order.status)} className="px-4 py-1 text-[10px] font-black uppercase tracking-widest">
                {order.status === "COMPLETED" ? "PAGADO" : order.status}
              </Badge>
            </TableCell>
            <TableCell className="text-foreground/40 text-[11px] font-bold">
              {order.order_items?.length ?? 0} item(s)
            </TableCell>
            <TableCell className="font-black text-primary text-sm">
              {formatPrice(orderTotal(order))}
            </TableCell>
            <TableCell className="text-foreground/30 text-[10px] font-bold uppercase tracking-widest">
              {formatDate(order.createdAt)}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                onClick={() => onSelectOrder(order)}
                className="text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary/10 rounded-xl"
              >
                Ver detalle
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </div>
  );
}
