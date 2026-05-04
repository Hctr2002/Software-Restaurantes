"use client";
 
 import React from "react";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@menu-bites/ui";
 import { TrendingUp, Wallet, ReceiptText, ClipboardList, UtensilsCrossed, Activity, ShieldAlert, UserCheck } from "lucide-react";
 import LocalShell from "./_components/LocalShell";
 import { formatPrice, formatDate, Order, StatsData, TableRecord } from "./_components/localShared";
 import { Badge } from "@menu-bites/ui";
 import { cn } from "@menu-bites/ui/lib/utils";
 import { motion } from "framer-motion";
 
 function tableStatusVariant(status: string) {
   if (status === "FREE")      return "success";
   if (status === "OCCUPIED")  return "danger";
   if (status === "RESERVED")  return "warning";
   if (status === "CLEANING")  return "info";
   return "neutral";
 }
 
 function orderStatusVariant(status: string) {
   if (status === "PENDING") return "warning";
   if (status === "PREPARING") return "info";
   if (status === "READY") return "success";
   if (status === "DELIVERED") return "neutral";
   return "neutral";
 }
 
 export default function DashboardPage() {
   const [stats, setStats] = React.useState<StatsData | null>(null);
   const [pedidosDia, setPedidosDia] = React.useState(0);
   const [orders, setOrders] = React.useState<Order[]>([]);
   const [tables, setTables] = React.useState<TableRecord[]>([]);
   const [loading, setLoading] = React.useState(true);
   const [error, setError] = React.useState<string | null>(null);
 
   const fetchData = React.useCallback(async () => {
     setError(null);
     try {
       const [statsRes, ordersRes, tablesRes] = await Promise.all([
         fetch("/api/local/stats", { cache: "no-store" }),
         fetch("/api/local/orders", { cache: "no-store" }),
         fetch("/api/local/tables", { cache: "no-store" }),
       ]);
 
       const statsJson = await statsRes.json();
       const ordersJson = await ordersRes.json();
       const tablesJson = await tablesRes.json();
 
       if (statsRes.ok) {
         setStats(statsJson.data || null);
         setPedidosDia(statsJson.data?.pedidos_dia ?? 0);
       }
       if (!ordersRes.ok) throw new Error(ordersJson.error || "Error cargando pedidos");
       if (!tablesRes.ok) throw new Error(tablesJson.error || "Error cargando mesas");
 
       setOrders(ordersJson.data || []);
       setTables(tablesJson.data || []);
     } catch (err) {
       setError(err instanceof Error ? err.message : "Error inesperado");
     } finally {
       setLoading(false);
     }
   }, []);
 
   React.useEffect(() => { fetchData(); }, [fetchData]);
 
   const pendingOrders = orders.filter((o) => o.status === "PENDING" || o.status === "PREPARING");
 
   const containerVariants = {
     hidden: { opacity: 0 },
     show: {
       opacity: 1,
       transition: {
         staggerChildren: 0.1
       }
     }
   };
 
   const itemVariants = {
     hidden: { opacity: 0, scale: 0.95 },
     show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } }
   };
 
   return (
     <LocalShell title="Panel Local" subtitle="Resumen">
       {error && (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-2xl border border-destructive/30 bg-destructive/10 text-sm text-destructive font-bold">
           {error}
         </motion.div>
       )}
 
       <motion.div 
         variants={containerVariants}
         initial="hidden"
         animate="show"
         className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6"
       >
         <motion.div variants={itemVariants}>
           <KpiCard
             icon={<Wallet className="w-5 h-5 text-emerald-400" />}
             label="Ingresos Hoy"
             value={formatPrice(stats?.ingresos_dia ?? 0)}
             detail={`${pedidosDia} pedidos hoy`}
           />
         </motion.div>
         <motion.div variants={itemVariants}>
           <KpiCard
             icon={<TrendingUp className="w-5 h-5 text-primary" />}
             label="Ingresos Mes"
             value={formatPrice(stats?.ingresos_mes ?? 0)}
             detail="Ventas acumuladas"
           />
         </motion.div>
         <motion.div variants={itemVariants}>
           <KpiCard
             icon={<ReceiptText className="w-5 h-5 text-amber-400" />}
             label="Ticket Promedio"
             value={formatPrice(stats?.ticket_promedio ?? 0)}
             detail="Hoy por entrega"
           />
         </motion.div>
         <motion.div variants={itemVariants}>
           <KpiCard
             icon={<ClipboardList className="w-5 h-5 text-rose-400" />}
             label="Pedidos Activos"
             value={String(pendingOrders.length)}
             detail="Pendientes/Cocina"
           />
         </motion.div>
       </motion.div>
 
       <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-4">
         {/* Top items */}
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
             {!stats?.top_items?.length ? (
               <p className="text-sm text-slate-500 italic">Sin pedidos hoy.</p>
             ) : (
               stats.top_items.map((item, i) => (
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
 
         {/* Últimos pedidos */}
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
             {orders.length === 0 && !loading && (
               <p className="text-sm text-slate-500 italic">No hay pedidos registrados.</p>
             )}
             {orders.slice(0, 8).map((order) => (
               <motion.div 
                 whileHover={{ x: 6 }}
                 key={order.id} 
                 className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors"
               >
                 <div>
                   <p className="text-sm font-black text-white tracking-tight">Mesa {order.tables?.number ?? "S/N"}</p>
                   <p className="text-[10px] font-bold text-slate-600 uppercase">{formatDate(order.createdAt)}</p>
                 </div>
                 <Badge variant={orderStatusVariant(order.status)} className="text-[9px] font-black">{order.status}</Badge>
               </motion.div>
             ))}
           </CardContent>
         </Card>
 
         {/* Grilla visual de mesas */}
         <Card className="border-white/5 bg-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden group">
           <CardHeader>
             <CardTitle className="flex items-center gap-3 text-white">
               <div className="p-2 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                 <TableProperties className="w-5 h-5 text-primary" />
               </div>
               Estado de Mesas
             </CardTitle>
             <CardDescription className="text-slate-500 font-medium">Distribución actual del salón</CardDescription>
           </CardHeader>
           <CardContent>
             {tables.length === 0 && !loading ? (
               <p className="text-sm text-slate-500 italic">No hay mesas registradas.</p>
             ) : (
               <div className="grid grid-cols-3 gap-3">
                 {tables.map((table) => (
                   <motion.div
                     whileHover={{ scale: 1.05 }}
                     key={table.id}
                     className={cn(
                       "flex flex-col items-center justify-center p-4 rounded-3xl border text-center transition-all duration-300 shadow-lg",
                       table.status === "FREE" && "bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5",
                       table.status === "OCCUPIED" && "bg-red-500/10 border-red-500/20 shadow-red-500/5",
                       table.status === "RESERVED" && "bg-amber-500/10 border-amber-500/20 shadow-amber-500/5",
                       !["FREE", "OCCUPIED", "RESERVED"].includes(table.status) && "bg-white/5 border-white/10"
                     )}
                   >
                     <p className={cn(
                       "text-2xl font-black tracking-tighter",
                       table.status === "FREE" && "text-emerald-400",
                       table.status === "OCCUPIED" && "text-red-400",
                       table.status === "RESERVED" && "text-amber-400",
                     )}>
                       {table.number}
                     </p>
                     <span className={cn(
                       "text-[9px] font-black uppercase mt-1 tracking-widest",
                       table.status === "FREE" && "text-emerald-600",
                       table.status === "OCCUPIED" && "text-red-600",
                       table.status === "RESERVED" && "text-amber-600",
                     )}>
                       {table.status === "FREE" ? "Libre" : table.status === "OCCUPIED" ? "Uso" : "Resv"}
                     </span>
                   </motion.div>
                 ))}
               </div>
             )}
           </CardContent>
         </Card>
       </div>
 
       {loading && (
         <div className="flex items-center gap-3 mt-8 text-primary font-bold uppercase tracking-widest text-[10px]">
           <Activity className="w-4 h-4 animate-pulse" />
           Sincronizando local...
         </div>
       )}
     </LocalShell>
   );
 }
 
 function KpiCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
   return (
     <Card className="border-white/5 bg-white/5 backdrop-blur-xl rounded-[2.5rem] hover:bg-white/10 transition-all duration-500 group overflow-hidden relative">
       <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity group-hover:scale-150 transition-transform duration-700">
         {icon}
       </div>
       <CardContent className="pt-8 px-8 pb-8 relative z-10">
         <div className="flex items-center gap-2 mb-2">
           <div className="p-1.5 bg-primary/10 rounded-lg">
             {React.cloneElement(icon as React.ReactElement<any>, { className: "w-3 h-3 text-primary" })}
           </div>
           <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">{label}</p>
         </div>
         <p className="text-3xl font-black tracking-tighter text-white">{value}</p>
         <p className="text-[10px] font-bold text-slate-600 mt-2 uppercase tracking-widest">{detail}</p>
       </CardContent>
     </Card>
   );
 }
import { TableProperties } from "lucide-react";
