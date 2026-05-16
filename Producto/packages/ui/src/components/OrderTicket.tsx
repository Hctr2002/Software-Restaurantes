"use client";
 
 import React, { useState, useEffect } from "react";
 import { cn } from "../lib/utils";
 import { Clock, CheckCircle2, PlayCircle, Utensils, AlertCircle, GlassWater, MessageSquare, X } from "lucide-react";
 import { motion, AnimatePresence } from "framer-motion";
 import { OrderItem, OrderStatus } from "@menu-bites/auth";
 
 interface OrderTicketProps {
   id: string;
   tableNumber?: number | null;
   status: OrderStatus;
   createdAt: string;
   items: OrderItem[];
   notes?: string | null;
   onStatusChange: (newStatus: OrderStatus) => void;
   onDismiss?: () => void;
   type?: 'KITCHEN' | 'BAR';
 }

 export const OrderTicket = ({ id, tableNumber, status, createdAt, items, notes, onStatusChange, onDismiss, type = 'KITCHEN' }: OrderTicketProps) => {
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
       transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
       className={cn(
         "relative flex flex-col p-8 rounded-[2.5rem] border transition-all duration-700 overflow-hidden",
         "bg-card",
         (status === "PENDING" || status === "VALIDATED") && "border-border shadow-2xl shadow-black/10",
         status === "PREPARING" && (type === 'BAR' ? "border-purple-500/50 bg-purple-500/5 shadow-2xl shadow-purple-500/5" : "border-primary/50 bg-primary/5 shadow-2xl shadow-primary/5"),
         status === "READY" && "border-emerald-500/50 bg-emerald-500/5 shadow-2xl shadow-emerald-500/5",
         isDelayed && status !== "READY" && "ring-2 ring-destructive/50 bg-destructive/5 animate-pulse"
       )}
     >
       {/* Bloom effect */}
       <div className={cn(
         "absolute -top-24 -right-24 w-48 h-48 blur-[100px] rounded-full pointer-events-none opacity-20 transition-colors duration-1000",
         status === "PREPARING" ? (type === 'BAR' ? "bg-purple-500" : "bg-primary") : 
         status === "READY" ? "bg-emerald-500" : "bg-white"
       )} />

       {isDelayed && status !== "READY" && (
         <div className="absolute top-0 right-0 bg-destructive text-destructive-foreground px-6 py-1.5 rounded-bl-[1.5rem] flex items-center gap-2 z-10 shadow-lg">
           <AlertCircle className="w-3.5 h-3.5" />
           <span className="text-[10px] font-black uppercase tracking-widest">Retrasado</span>
         </div>
       )}
 
       <div className="flex justify-between items-start mb-8 relative z-10">
         <div className="flex items-center space-x-5">
           <div className={cn(
             "w-20 h-20 rounded-[1.75rem] flex items-center justify-center border transition-all duration-500 group shadow-inner",
             type === 'BAR' ? "bg-purple-500/10 border-purple-500/20" : "bg-muted/30 border-border"
           )}>
             <span className="text-4xl font-black text-foreground tracking-tighter drop-shadow-sm">{tableNumber ?? "?"}</span>
           </div>
           <div>
             <p className="text-[11px] uppercase font-black tracking-[0.25em] text-foreground/40 mb-1">Mesa</p>
             <p className="text-[10px] font-bold text-foreground/20 font-mono tracking-widest bg-muted/30 px-2 py-0.5 rounded-lg border border-border">#{id.slice(0, 8)}</p>
           </div>
         </div>
         <div className={cn(
           "px-5 py-2.5 rounded-2xl flex items-center space-x-2 bg-muted/30 shadow-xl border border-border",
           isDelayed ? "text-destructive" : "text-foreground/60"
         )}>
           <Clock className="w-4 h-4 opacity-70" />
           <span className="text-sm font-black tracking-tighter font-mono">{elapsed}m</span>
         </div>
       </div>
 
       {notes && (
         <div className={cn(
           "flex flex-col gap-1 px-5 py-4 rounded-2xl border mb-6 relative z-10",
           type === 'BAR' ? "bg-purple-500/20 border-purple-500/30" : "bg-amber-500/20 border-amber-500/30"
         )}>
           <div className="flex items-center gap-2 mb-1">
             <MessageSquare className={cn("w-3.5 h-3.5", type === 'BAR' ? "text-purple-400" : "text-amber-500")} />
             <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", type === 'BAR' ? "text-purple-600" : "text-amber-600")}>Notas del Pedido</span>
           </div>
           <p className={cn("text-xs font-bold italic leading-relaxed", type === 'BAR' ? "text-purple-900/80" : "text-amber-900/80")}>{notes}</p>
         </div>
       )}

       <div className="flex-1 space-y-3.5 mb-10 relative z-10">
         {items.map((item, idx) => (
           <motion.div 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: idx * 0.1, duration: 0.5, ease: "easeOut" }}
             key={item.id} 
             className="flex items-center justify-between p-4 rounded-[1.5rem] bg-muted/30 border border-border group hover:bg-muted/50 hover:border-border transition-all duration-300"
           >
             <div className="flex items-center space-x-4">
               <span className={cn(
                 "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black border transition-all duration-300 shadow-sm",
                 type === 'BAR' ? "bg-purple-500/20 text-purple-600 border-purple-500/20" : "bg-primary/20 text-primary border-primary/20"
               )}>
                 {item.quantity}
               </span>
               <div className="flex flex-col">
                 <span className="text-sm font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{item.menuItem?.name || item.menu_items?.name || "Ítem sin nombre"}</span>
                 {item.notes && <span className="text-[10px] font-bold text-foreground/30 italic mt-0.5">{item.notes}</span>}
               </div>
             </div>
             {type === 'BAR' ? (
                <GlassWater className="w-4.5 h-4.5 text-foreground/10 group-hover:text-purple-400/40 transition-colors" />
              ) : (
                <Utensils className="w-4.5 h-4.5 text-foreground/10 group-hover:text-primary/40 transition-colors" />
              )}
           </motion.div>
         ))}
       </div>


        {onStatusChange && (
          <div className="pt-8 mt-auto border-t border-border relative z-10">
            <div className="flex space-x-4">
              <AnimatePresence mode="wait">
                {(status === "PENDING" || status === "VALIDATED") && (
                  <motion.button 
                    key="btn-preparing"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    whileHover={{ scale: 1.02, translateY: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onStatusChange("PREPARING")}
                    className={cn(
                      "flex-1 py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl transition-all flex items-center justify-center space-x-3",
                      type === 'BAR' ? "bg-purple-600 text-white shadow-purple-900/20 hover:shadow-purple-600/40" : "bg-primary text-primary-foreground shadow-primary/20 hover:shadow-primary/40"
                    )}
                  >
                    <PlayCircle className="w-5 h-5" />
                    <span>Comenzar</span>
                  </motion.button>
                )}
                {status === "PREPARING" && (
                  <motion.button 
                    key="btn-ready"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    whileHover={{ scale: 1.02, translateY: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onStatusChange("READY")}
                    className="flex-1 py-5 bg-emerald-500 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-emerald-900/20 hover:shadow-emerald-500/40 transition-all flex items-center justify-center space-x-3"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Terminar</span>
                  </motion.button>
                )}
                {status === "READY" && (
                  <div className="flex flex-1 gap-3">
                    <div className="flex-1 py-5 bg-muted/30 border border-border text-emerald-500 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.25em] flex items-center justify-center space-x-3">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Listo</span>
                    </div>
                    {onDismiss && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onDismiss}
                        className="px-5 py-5 bg-muted/30 border border-border hover:bg-muted/50 hover:border-border text-foreground/40 hover:text-foreground rounded-[1.5rem] transition-all duration-300 flex items-center justify-center"
                        title="Retirar de la cola"
                      >
                        <X className="w-5 h-5" />
                      </motion.button>
                    )}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
     </motion.div>
   );
 };
