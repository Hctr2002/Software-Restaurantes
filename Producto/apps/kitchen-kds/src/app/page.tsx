"use client";
 
 import React, { useEffect, useRef, useState } from "react";
 import { useAuthStore } from "@menu-bites/store";
 import { supabase, useKitchenOrders, updateOrderStatus, signOut, sendAlert, getRestaurantTheme } from "@menu-bites/auth";
 import { OrderTicket, cn, Button, RestaurantThemeProvider } from "@menu-bites/ui";
 import { ChefHat, Bell, Settings, LogOut, AlertTriangle, X, Loader2, Activity } from "lucide-react";
 import { useRouter } from "next/navigation";
 import { MOCK_ORDERS, type MockOrder } from "../lib/mock-orders";
 import { motion, AnimatePresence } from "framer-motion";
 
 const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === "true";
 
 export default function KitchenKDSPage() {
   const { user, logout: clearAuth } = useAuthStore();
   const { orders: liveOrders, loading: liveLoading } = useKitchenOrders(
     MOCK_MODE ? undefined : user?.restaurantId
   );
   const [mockOrders, setMockOrders] = useState<MockOrder[]>(MOCK_ORDERS);
   const prevOrdersCount = useRef(0);
   const [isSigningOut, setIsSigningOut] = React.useState(false);
   const [alertModal, setAlertModal] = useState(false);
   const [alertMsg, setAlertMsg] = useState("");
   const [alertItem, setAlertItem] = useState("");
   const [sendingAlert, setSendingAlert] = useState(false);
   const [alertSent, setAlertSent] = useState(false);
   const [theme, setTheme] = useState<any>(null);
   const router = useRouter();
 
   const orders = MOCK_MODE ? mockOrders : liveOrders;
   const loading = MOCK_MODE ? false : liveLoading;
 
   const handleSignOut = async () => {
     const loginUrl = process.env.NEXT_PUBLIC_AUTH_URL || "/";
     setIsSigningOut(true);
     try {
       await signOut();
     } finally {
       clearAuth();
       router.refresh();
       window.location.href = loginUrl;
     }
   };
 
   useEffect(() => {
     if (!user?.restaurantId) return;
     const restaurantId = user.restaurantId;
 
     getRestaurantTheme(restaurantId).then(setTheme);
 
     const channel = supabase
       .channel(`kds-theme-${restaurantId}`)
       .on(
         "postgres_changes",
         { event: "UPDATE", schema: "public", table: "restaurant_themes", filter: `restaurant_id=eq.${restaurantId}` },
         async (payload) => {
           if (payload.new.is_active) {
             const updated = await getRestaurantTheme(restaurantId);
             setTheme(updated);
           }
         }
       )
       .subscribe();
 
     return () => { supabase.removeChannel(channel); };
   }, [user?.restaurantId]);
 
   useEffect(() => {
     if (orders.length > prevOrdersCount.current) {
       const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
       audio.play().catch(() => {});
     }
     prevOrdersCount.current = orders.length;
   }, [orders.length]);
 
   const handleStatusChange = async (orderId: string, newStatus: string) => {
     if (MOCK_MODE) {
       setMockOrders((prev) =>
         prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as MockOrder["status"] } : o))
       );
       return;
     }
     await updateOrderStatus(orderId, newStatus);
   };
 
   const handleSendAlert = async () => {
     if (!alertMsg.trim() || !user?.restaurantId) return;
     setSendingAlert(true);
     const { error } = await sendAlert({
       restaurantId: user.restaurantId,
       userId: user.id,
       userEmail: user.email,
       type: "STOCK_SHORTAGE",
       message: alertMsg.trim(),
       menuItemName: alertItem.trim() || undefined,
     });
     setSendingAlert(false);
     if (!error) {
       setAlertSent(true);
       setTimeout(() => {
         setAlertSent(false);
         setAlertModal(false);
         setAlertMsg("");
         setAlertItem("");
       }, 1500);
     }
   };
 
   const pendingOrders   = orders.filter((o) => o.status === "PENDING");
   const preparingOrders = orders.filter((o) => o.status === "PREPARING");
   const readyOrders     = orders.filter((o) => o.status === "READY");
 
   if (loading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-slate-950">
         <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-primary shadow-2xl shadow-primary/20" />
       </div>
     );
   }
 
   return (
     <RestaurantThemeProvider theme={theme} isGlobal={true}>
       <div className="min-h-screen wow-gradient text-foreground overflow-hidden flex flex-col p-4 lg:p-6 gap-6">
         <header className="glass-premium rounded-[2.5rem] p-6 flex justify-between items-center shadow-2xl">
           <div className="flex items-center space-x-6">
             <motion.div 
               whileHover={{ rotate: 15, scale: 1.1 }}
               className="w-16 h-16 bg-primary rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-primary/30"
             >
               <ChefHat className="text-primary-foreground w-8 h-8" />
             </motion.div>
             <div>
               <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Kitchen <span className="text-primary">Monitor</span></h1>
               <div className="flex items-center space-x-3 text-[10px] font-black text-foreground/40 uppercase tracking-[0.3em] mt-1">
                 <span className="text-emerald-500 animate-pulse">● Live System</span>
                 <span>•</span>
                 <span>{MOCK_MODE ? "Demo Mode" : "Main Station"}</span>
               </div>
             </div>
           </div>
 
           <div className="flex items-center space-x-6">
             <div className="flex items-center space-x-12 px-10 py-3 glass rounded-[2rem] border border-white/5 shadow-xl">
               <Stat label="Recibidos" value={pendingOrders.length} color="text-slate-400" />
               <Stat label="En Fuego"   value={preparingOrders.length} color="text-primary" />
               <Stat label="Listos"     value={readyOrders.length} color="text-emerald-500" />
             </div>
 
             <Button
               variant="outline"
               onClick={() => setAlertModal(true)}
               disabled={MOCK_MODE}
               className="rounded-2xl h-14 px-8 border-yellow-500/20 bg-yellow-500/5 text-yellow-500 hover:bg-yellow-500/10 hover:border-yellow-500/40 gap-3 font-black uppercase tracking-widest text-[10px]"
             >
               <AlertTriangle className="w-5 h-5" />
               Alerta Stock
             </Button>
 
             <Button 
               variant="destructive" 
               size="icon" 
               onClick={handleSignOut} 
               disabled={isSigningOut || MOCK_MODE} 
               className="rounded-2xl w-14 h-14 shadow-xl shadow-destructive/20"
             >
               <LogOut className="w-6 h-6" />
             </Button>
           </div>
         </header>
 
         <main className="flex-1 grid grid-cols-3 gap-6 overflow-hidden">
           <AnimatePresence mode="popLayout">
             <KDSColumn key="column-pending" title="Pedidos Nuevos" count={pendingOrders.length} icon={<Bell className="w-5 h-5 text-slate-500" />}>
               {pendingOrders.map((order) => (
                 <OrderTicket key={`pending-${order.id}`} id={order.id} tableNumber={order.table.number} status={order.status} createdAt={order.created_at} items={order.items} onStatusChange={(s) => handleStatusChange(order.id, s)} />
               ))}
             </KDSColumn>
             
             <KDSColumn key="column-preparing" title="Preparando" count={preparingOrders.length} icon={<ChefHat className="w-5 h-5 text-primary" />} active>
               {preparingOrders.map((order) => (
                 <OrderTicket key={`preparing-${order.id}`} id={order.id} tableNumber={order.table.number} status={order.status} createdAt={order.created_at} items={order.items} onStatusChange={(s) => handleStatusChange(order.id, s)} />
               ))}
             </KDSColumn>
 
             <KDSColumn key="column-ready" title="Para Despacho" count={readyOrders.length} icon={<Activity className="w-5 h-5 text-emerald-500" />}>
               {readyOrders.map((order) => (
                 <OrderTicket key={`ready-${order.id}`} id={order.id} tableNumber={order.table.number} status={order.status} createdAt={order.created_at} items={order.items} onStatusChange={(s) => handleStatusChange(order.id, s)} />
               ))}
             </KDSColumn>
           </AnimatePresence>
         </main>
 
         {/* Modal Alerta */}
         <AnimatePresence>
           {alertModal && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="absolute inset-0 bg-black/80 backdrop-blur-md"
                 onClick={() => setAlertModal(false)}
               />
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0, y: 20 }}
                 animate={{ scale: 1, opacity: 1, y: 0 }}
                 exit={{ scale: 0.9, opacity: 0, y: 20 }}
                 className="w-full max-w-lg glass-premium rounded-[3rem] p-10 space-y-8 relative shadow-2xl border-white/10"
               >
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="p-3 bg-yellow-500/10 rounded-2xl">
                       <AlertTriangle className="w-6 h-6 text-yellow-500" />
                     </div>
                     <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">
                       Reportar Quiebre
                     </h2>
                   </div>
                   <button onClick={() => setAlertModal(false)} className="p-2 rounded-xl glass hover:text-white transition-colors">
                     <X className="w-5 h-5" />
                   </button>
                 </div>
 
                 <div className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Producto Afectado</label>
                     <input
                       type="text"
                       placeholder="Ej. Salmón Ahumado..."
                       value={alertItem}
                       onChange={(e) => setAlertItem(e.target.value)}
                       className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Mensaje Detallado</label>
                     <textarea
                       rows={3}
                       placeholder="Indica el motivo o cantidad restante..."
                       value={alertMsg}
                       onChange={(e) => setAlertMsg(e.target.value)}
                       className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 resize-none"
                     />
                   </div>
                 </div>
 
                 <div className="flex gap-4">
                   <Button variant="outline" onClick={() => setAlertModal(false)} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancelar</Button>
                   <Button
                     onClick={handleSendAlert}
                     disabled={!alertMsg.trim() || sendingAlert || alertSent}
                     className="flex-1 h-14 rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-widest text-[10px] gap-2 shadow-xl shadow-yellow-500/20"
                   >
                     {alertSent ? "Enviado ✓" : sendingAlert ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enviar Alerta"}
                   </Button>
                 </div>
               </motion.div>
             </div>
           )}
         </AnimatePresence>
       </div>
     </RestaurantThemeProvider>
   );
 }
 
 function Stat({ label, value, color }: { label: string; value: number; color: string }) {
   return (
     <div className="text-center group">
       <p className="text-[9px] font-black text-slate-600 uppercase mb-1 tracking-[0.2em] group-hover:text-foreground transition-colors">{label}</p>
       <p className={cn("text-3xl font-black tracking-tighter leading-none transition-transform group-hover:scale-110", color)}>{value}</p>
     </div>
   );
 }
 
 function KDSColumn({ title, count, icon, children, active }: { title: string; count: number; icon: React.ReactNode; children: React.ReactNode; active?: boolean }) {
   return (
     <motion.div 
       layout
       className={cn(
         "flex flex-col h-full glass-premium rounded-[3rem] border border-white/5 overflow-hidden transition-all duration-700", 
         active ? "bg-primary/[0.03] border-primary/20 ring-1 ring-primary/10 shadow-2xl shadow-primary/5" : "shadow-xl"
       )}
     >
       <div className="p-8 flex justify-between items-center border-b border-white/5 bg-white/[0.02]">
         <div className="flex items-center space-x-4">
           <div className={cn("p-2 rounded-xl", active ? "bg-primary/20" : "bg-white/5")}>
             {icon}
           </div>
           <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-foreground/60">{title}</h3>
         </div>
         <span className={cn(
           "px-4 py-1.5 rounded-full text-xs font-black shadow-lg", 
           active ? "bg-primary text-primary-foreground" : "bg-white/10 text-foreground"
         )}>{count}</span>
       </div>
       <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
         {children}
         {count === 0 && (
           <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             className="h-full flex flex-col items-center justify-center opacity-10 space-y-4"
           >
             <div className="w-20 h-20 border-2 border-dashed border-foreground rounded-full flex items-center justify-center">
               {icon}
             </div>
             <p className="font-black uppercase tracking-[0.2em] text-[10px]">Sin actividad</p>
           </motion.div>
         )}
       </div>
     </motion.div>
   );
 }
