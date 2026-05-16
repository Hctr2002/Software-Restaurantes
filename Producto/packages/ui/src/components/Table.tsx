"use client";

import React from "react";

interface TableProps {
  headers: string[];
  children: React.ReactNode;
}

export function Table({ headers, children }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-[2.5rem] border border-border bg-card shadow-xl">
      <table className="w-full text-left text-sm text-foreground/80">
        <thead className="bg-muted/30 text-[10px] uppercase text-foreground/40 font-black tracking-[0.2em] border-b border-border">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-8 py-6 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">{children}</tbody>
      </table>
    </div>
  );
}

export function TableRow({ children }: { children: React.ReactNode }) {
  return <tr className="hover:bg-muted/50 transition-colors group cursor-default">{children}</tr>;
}

export function TableCell({
  children,
  className = "",
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td className={`px-8 py-6 whitespace-nowrap ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}
