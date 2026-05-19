"use client";

import React from "react";

/**
 * Props para el componente Table.
 */
interface TableProps {
  headers: string[];
  children: React.ReactNode;
}

/**
 * Componente de Tabla principal.
 * Implementa una estructura responsiva utilizando variables del tema dinámico.
 * bg-card/30 y border-border aseguran consistencia visual con el resto del dashboard.
 */
export function Table({ headers, children }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border bg-card/30">
      <table className="w-full text-left text-sm text-muted-foreground">
        {/* Encabezado de la tabla con estilos semánticos */}
        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-bold border-b border-border">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-6 py-4 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        {/* Cuerpo de la tabla con divisiones suaves entre filas */}
        <tbody className="divide-y divide-border/50">
          {children}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Fila de la tabla con efecto hover reactivo al tema.
 */
export function TableRow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <tr className={`hover:bg-accent/30 transition-colors group ${className}`}>
      {children}
    </tr>
  );
}

/**
 * Celda individual de la tabla.
 */
export function TableCell({ children, className = "", colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}
