"use client";
 
 import React, { useState, useEffect } from "react";
 import { cn } from "../lib/utils";
 import { Clock, CheckCircle2, PlayCircle, Utensils, AlertCircle } from "lucide-react";
 import { motion, AnimatePresence } from "framer-motion";
 
 export type OrderStatus = "PENDING" | "VALIDATED" | "PREPARING" | "READY" | "DELIVERED";
 
 interface OrderItem {
   id: string;
   quantity: number;
   menuItem: {
     name: string;
   };
 }
 
 interface OrderTicketProps {
   id: string;
   tableNumber: number;
   status: OrderStatus;
   createdAt: string;
   items: OrderItem[];
   onStatusChange: (newStatus: OrderStatus) => void;
 }
 
 export const OrderTicket = ({ id, tableNumber, status, createdAt, items, onStatusChange }: OrderTicketProps) => {
   const [elapsed, setElapsed] = useState(0);
 
   useEffect(() => {
     const start = new Date(createdAt).getTime();
     const interval = setInterval(() => {
       setElapsed(Math.floor((Date.now() - start) / 1000 / 60));
     }, 10000);
 
     setElapsed(Math.floor((Date.now() - start) / 1000 / 60));
     return () => clearInterval(interval);
   }, [createdAt]);
 
   const isDelayed = elapsed >= 15;
 
   return (
     <motion.div 
       layout
       initial={{ opacity: 0, scale: 0.9 }}
       animate={{ opacity: 1, scale: 1 }}
       exit={{ opacity: 0, scale: 0.9 }}
       className={cn(
         "relative flex flex-col p-6 rounded-[2.5rem] border glass-premium transition-all duration-500 overflow-hidden",
         (status === "PENDING" || status === "VALIDATED") && "border-white/5 bg-white/5 shadow-xl shadow-black/20",
         status === "PREPARING" && "border-primary/20 bg-primary/5 shadow-xl shadow-primary/5",
         status === "READY" && "border-emerald-500/20 bg-emerald-500/5 shadow-xl shadow-emerald-500/5",
         isDelayed && status !== "READY" && "ring-2 ring-destructive/40 bg-destructive/5 animate-pulse"
       )}
     >
       {isDelayed && status !== "READY" && (
         <div className="absolute top-0 right-0 bg-destructive text-destructive-foreground px-4 py-1 rounded-bl-2xl flex items-center gap-1 z-10">
           <AlertCircle className="w-3 h-3" />
           <span className="text-[9px] font-black uppercase tracking-tighter">Retrasado</span>
         </div>
       )}
 
       <div className="flex justify-between items-start mb-6">
         <div className="flex items-center space-x-4">
           <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner group">
             <span className="text-3xl font-black text-foreground tracking-tighter">{tableNumber}</span>
           </div>
           <div>
             <p className="text-[10px] uppercase font-black tracking-[0.2em] text-foreground/30">Mesa</p>
             <p className="text-[10px] font-bold text-foreground/20 font-mono">#{id.slice(0, 8)}</p>
           </div>
         </div>
         <div className={cn(
           "px-4 py-2 rounded-2xl flex items-center space-x-2 glass shadow-lg",
           isDelayed ? "text-destructive" : "text-foreground/40"
         )}>
           <Clock className="w-4 h-4" />
           <span className="text-xs font-black tracking-tighter">{elapsed}m</span>
         </div>
       </div>
 
       <div className="flex-1 space-y-3 mb-8">
         {items.map((item) => (
           <motion.div 
             initial={{ opacity: 0, x: -10 }}
             animate={{ opacity: 1, x: 0 }}
             key={item.id} 
             className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors"
           >
             <div className="flex items-center space-x-4">
               <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-black text-primary border border-primary/10">
                 {item.quantity}
               </span>
               <span className="text-sm font-black text-foreground tracking-tight">{item.menuItem?.name || item.menu_items?.name || "Plato sin nombre"}</span>
             </div>
             <Utensils className="w-4 h-4 text-foreground/10 group-hover:text-primary/40 transition-colors" />
           </motion.div>
         ))}
       </div>
        {onStatusChange && (
          <div className="pt-6 mt-6 border-t border-white/5">
            <div className="flex space-x-3">
              <AnimatePresence mode="wait">
                {(status === "PENDING" || status === "VALIDATED") && (
                  <motion.button 
                    key="btn-preparing"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onStatusChange("PREPARING")}
                    className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center space-x-2"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Comenzar</span>
                  </motion.button>
                )}
                {status === "PREPARING" && (
                  <motion.button 
                    key="btn-ready"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onStatusChange("READY")}
                    className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all flex items-center justify-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Terminar</span>
                  </motion.button>
                )}
                {status === "READY" && (
                  <div className="flex-1 py-4 bg-white/5 border border-white/5 text-emerald-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center space-x-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Listo</span>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
     </motion.div>
   );
 };
