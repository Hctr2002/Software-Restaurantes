"use client";

import { ClipboardList, X } from "lucide-react";
import { Order } from "@menu-bites/auth";
import { PortalHeading, PortalText, PortalCard } from "./primitives";

/**
 * Propiedades del componente CuentaSheet.
 */
interface Props {
  tableLabel: string;
  orders: Order[];
  onClose: () => void;
}

/**
 * Función para formatear valores numéricos a moneda chilena (CLP).
 */
function formatCLP(n: number) {
  return `$${n.toLocaleString("es-CL")}`;
}

/**
 * Etiquetas legibles para los estados de los pedidos.
 */
const STATUS_LABEL: Record<string, string> = {
  PENDING:   "Solicitado",
  VALIDATED: "Confirmado",
  PREPARING: "En preparación",
  READY:     "🍽️ Listo",
  DELIVERED: "Entregado",
  COMPLETED: "Completado",
};

/**
 * Clases de estilo para los estados, mapeadas a tokens del tema.
 */
const STATUS_CLASS: Record<string, string> = {
  READY:     "bg-success/20 text-success border border-success/30",
  PREPARING: "bg-primary/20 text-primary border border-primary/30",
  VALIDATED: "bg-primary/10 text-primary/70 border border-primary/20",
  PENDING:   "bg-foreground/10 text-foreground/50 border border-foreground/20",
  DELIVERED: "bg-success/10 text-success/70 border border-success/20",
  COMPLETED: "bg-foreground/5 text-foreground/40 border border-foreground/10",
};

/**
 * Componente que muestra el detalle de la cuenta del cliente.
 * // Función para heredar el tema dinámico y mostrar el resumen de consumos.
 */
export function CuentaSheet({ tableLabel, orders, onClose }: Props) {
  // Cálculo del total acumulado de todos los pedidos
  const total = orders.reduce(
    (s, o) => s + (o.orderItems?.reduce((si, i) => si + Number(i.unitPrice) * i.quantity, 0) || 0),
    0,
  );

  // Agrupar pedidos por mesa para soportar sesiones multimesa
  const ordersByTable: Record<string, typeof orders> = {};

  orders.forEach(order => {
    const tableKey = order.tableNumber ? `Mesa ${order.tableNumber}` : "Sin Mesa";
    if (!ordersByTable[tableKey]) ordersByTable[tableKey] = [];
    ordersByTable[tableKey].push(order);
  });

  return (
    <div className="fixed inset-0 z-[70] animate-in fade-in duration-200">
      {/* Fondo desenfocado — usa el color de fondo del tema */}
      <div className="absolute inset-0 bg-background/95" onClick={onClose} />
      
      {/* Contenedor principal sólido y bordes redondeados */}
      <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-[2.5rem] p-6 h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300 border-t border-foreground/10 shadow-2xl">
        
        {/* Encabezado de la hoja de cuenta */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <PortalHeading as="h2" className="text-xl font-bold flex items-center gap-2">
              <ClipboardList className="text-primary w-5 h-5" />
              Mi Cuenta
            </PortalHeading>
            <PortalText muted className="text-xs mt-0.5">
              Mesa {tableLabel} · Detalle de consumos
            </PortalText>
          </div>
          {/* Botón para cerrar la vista */}
          <button onClick={onClose} className="p-2 rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors border border-foreground/10">
            <X className="w-4 h-4 text-foreground/60" />
          </button>
        </div>

        {/* Área de contenido con scroll para los pedidos */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-2 -mr-2 space-y-6">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-foreground/40 space-y-3">
              <ClipboardList className="w-12 h-12 opacity-20" />
              <PortalText className="text-sm font-medium">No hay pedidos activos en esta sesión.</PortalText>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(ordersByTable).map(([tableKey, tableOrders]) => (
                <div key={tableKey} className="space-y-3">
                  {/* Título de la mesa — usa tipografía de título del tema */}
                  <PortalHeading as="h3" className="text-sm font-bold flex items-center gap-2 border-b border-foreground/5 pb-2">
                    <ClipboardList className="w-4 h-4 text-primary" />
                    {tableKey}
                  </PortalHeading>
                  
                  <div className="space-y-4">
                    {tableOrders.map((order) => (
                      <PortalCard key={order.id} className="p-4 space-y-3 hover:bg-foreground/[0.02] transition-colors duration-300">
                        
                        {/* Cabecera del pedido individual */}
                        <div className="flex items-center justify-between border-b border-foreground/5 pb-2">
                          <div>
                            <span className="text-xs font-black text-foreground/40 uppercase tracking-widest">Pedido #{orders.length - orders.indexOf(order)}</span>
                            <PortalText className="text-[10px] text-foreground/30">
                              {new Date(order.createdAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                            </PortalText>
                          </div>
                          {/* // Función para visualizar el estado del pedido con colores semánticos */}
                          <PortalText 
                            as="span"
                            className={`text-[10px] font-black px-2.5 py-1 rounded-full ${STATUS_CLASS[order.status] ?? "bg-foreground/10 text-foreground/50"}`}
                          >
                            {STATUS_LABEL[order.status] ?? order.status}
                          </PortalText>
                        </div>

                        {/* Listado de items del pedido */}
                        <div className="space-y-2 pt-1">
                          {order.orderItems?.map((item, j) => (
                            <div key={j} className="flex justify-between items-center text-sm">
                              <PortalText as="span" className="text-foreground/80 flex items-center gap-3">
                                {/* // Función para resaltar la cantidad del item solicitado */}
                                <PortalText 
                                  as="span" 
                                  style={{ fontFamily: "var(--font-accent)" }}
                                  className="font-bold text-primary bg-primary/10 w-6 h-6 flex items-center justify-center rounded-lg text-xs border border-primary/20"
                                >
                                  {item.quantity}
                                </PortalText>
                                <PortalText as="span" className="font-medium">{item.menuItem?.name ?? "Item"}</PortalText>
                              </PortalText>
                              <PortalText as="span" className="font-bold">
                                {formatCLP(Number(item.unitPrice) * item.quantity)}
                              </PortalText>
                            </div>
                          ))}
                        </div>

                        {/* Subtotal por cada pedido */}
                        <div className="flex justify-between items-center pt-2 border-t border-foreground/5 text-xs">
                          <PortalText as="span" muted className="font-medium">Subtotal</PortalText>
                          <PortalText as="span" className="font-bold opacity-80">
                            {formatCLP(order.orderItems?.reduce((s, item) => s + Number(item.unitPrice) * item.quantity, 0) || 0)}
                          </PortalText>
                        </div>
                      </PortalCard>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total General — Fijo en la parte inferior */}
        {orders.length > 0 && (
          <div className="mt-4 pt-5 border-t border-foreground/10 flex justify-between items-center bg-card -mx-6 px-6 -mb-6 pb-6 rounded-b-[2.5rem] shrink-0">
            <div>
              {/* // Función para mostrar el título del total general del consumo */}
              <PortalHeading as="h3" className="font-bold text-lg block">Total Acumulado</PortalHeading>
              <PortalText className="text-xs text-foreground/40">{orders.length} pedido{orders.length !== 1 ? 's' : ''} en curso</PortalText>
            </div>
            {/* // Función para destacar el valor total con la fuente de acento del tema */}
            <PortalText 
              as="span" 
              style={{ fontFamily: "var(--font-accent)" }}
              className="text-2xl font-black text-primary bg-primary/5 px-4 py-2 rounded-xl border border-primary/10"
            >
              {formatCLP(total)}
            </PortalText>
          </div>
        )}
      </div>
    </div>
  );
}

