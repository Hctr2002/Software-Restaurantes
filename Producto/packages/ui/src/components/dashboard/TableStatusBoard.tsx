"use client";

/**
 * TableStatusBoard — Panel visual del estado de todas las mesas del restaurante.
 * Muestra una grilla de tarjetas de mesa con su estado (FREE, OCCUPIED, RESERVED, CLEANING)
 * y solicitudes pendientes (cuenta, asistencia). Usado en el dashboard del dueño y en el terminal.
 */

import React from "react";
import { motion } from "framer-motion";
import { TableProperties } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { cn } from "../../lib/utils";
import { TableRecord } from "./dashboardTypes";

interface TableStatusBoardProps {
  tables: TableRecord[] | any[];
}

export function TableStatusBoard({ tables }: TableStatusBoardProps) {
  return (
    <Card className="border-border bg-card rounded-[2.5rem] overflow-hidden group mt-6 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-foreground">
          <div className="p-2 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
            <TableProperties className="w-5 h-5 text-primary" />
          </div>
          Estado de Mesas
        </CardTitle>
        <CardDescription className="text-muted-foreground font-medium">Distribución actual del salón</CardDescription>
      </CardHeader>
      <CardContent>
        {tables.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No hay mesas registradas.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tables.map((table) => (
              <motion.div
                whileHover={{ scale: 1.05 }}
                key={table.id}
                className={cn(
                  "flex flex-col items-center justify-center p-6 rounded-[2.5rem] border text-center transition-all duration-300 shadow-lg",
                  table.status === "FREE"      && "bg-emerald-500/5 border-emerald-500/10 shadow-emerald-500/5",
                  table.status === "OCCUPIED"  && "bg-red-500/5 border-red-500/10 shadow-red-500/5",
                  table.status === "RESERVED"  && "bg-amber-500/5 border-amber-500/10 shadow-amber-500/5",
                  table.status === "CLEANING"  && "bg-sky-500/5 border-sky-500/10 shadow-sky-500/5",
                  !["FREE","OCCUPIED","RESERVED","CLEANING"].includes(table.status) && "bg-foreground/[0.03] border-foreground/5"
                )}
              >
                <p className={cn(
                  "text-3xl font-black tracking-tighter",
                  table.status === "FREE"     && "text-emerald-500/90",
                  table.status === "OCCUPIED" && "text-red-500/90",
                  table.status === "RESERVED" && "text-amber-500/90",
                  table.status === "CLEANING" && "text-sky-500/90",
                )}>
                  {table.number}
                </p>
                <span className={cn(
                  "text-[9px] font-black uppercase mt-1 tracking-widest leading-none",
                  table.status === "FREE"     && "text-emerald-500/60",
                  table.status === "OCCUPIED" && "text-red-500/60",
                  table.status === "RESERVED" && "text-amber-500/60",
                  table.status === "CLEANING" && "text-sky-500/60",
                )}>
                  {table.status === "FREE" ? "Libre" : table.status === "OCCUPIED" ? "Uso" :
                   table.status === "CLEANING" ? "Limpieza" : "Resv"}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
