"use client";

import React from "react";
import { motion } from "framer-motion";
import { UtensilsCrossed, ClipboardList } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../Badge";
import { formatDate } from "../../lib/utils";
import { Order } from "./dashboardTypes";

interface OrderActivityFeedProps {
  orders: Order[] | any[];
  topItems: any[];
}

function orderStatusVariant(status: string) {
  if (status === "PENDING") return "warning";
  if (status === "PREPARING") return "info";
  if (status === "READY") return "success";
  if (status === "DELIVERED") return "neutral";
  return "neutral";
}

export function OrderActivityFeed({ orders, topItems }: OrderActivityFeedProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="border-white/5 bg-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden group">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="p-2 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
            </div>
            Top Items Hoy
          </CardTitle>
          <CardDescription className="text-slate-500 font-medium">Los platos más pedidos del día</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!topItems?.length ? (
            <p className="text-sm text-slate-500 italic">Sin pedidos hoy.</p>
          ) : (
            topItems.map((item, i) => (
              <motion.div 
                whileHover={{ x: 6 }}
                key={item.name} 
                className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-slate-600 bg-white/5 w-6 h-6 flex items-center justify-center rounded-lg">#{i + 1}</span>
                  <span className="text-sm font-black text-white tracking-tight">{item.name}</span>
                </div>
                <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase">
                  {item.count} Unid.
                </span>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-white/5 bg-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden group">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="p-2 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            Últimos Pedidos
          </CardTitle>
          <CardDescription className="text-slate-500 font-medium">Actividad reciente en tiempo real</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {orders.length === 0 && (
            <p className="text-sm text-slate-500 italic">No hay pedidos registrados.</p>
          )}
          {orders.slice(0, 8).map((order) => (
            <motion.div 
              whileHover={{ x: 6 }}
              key={order.id} 
              className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div>
                <p className="text-sm font-black text-white tracking-tight">Mesa {order.table?.number ?? "S/N"}</p>
                <p className="text-[10px] font-bold text-slate-600 uppercase">{formatDate(order.createdAt)}</p>
              </div>
              <Badge variant={orderStatusVariant(order.status)} className="text-[9px] font-black">{order.status}</Badge>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
