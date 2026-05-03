"use client";

import React from "react";

interface TableProps {
  headers: string[];
  children: React.ReactNode;
}

export function Table({ headers, children }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-[2.5rem] border border-white/5 bg-white/5 backdrop-blur-md shadow-2xl">
      <table className="w-full text-left text-sm text-foreground/80">
        <thead className="bg-white/5 text-[10px] uppercase text-foreground/30 font-black tracking-[0.2em] border-b border-white/5">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-8 py-6 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">{children}</tbody>
      </table>
    </div>
  );
}

export function TableRow({ children }: { children: React.ReactNode }) {
  return <tr className="hover:bg-white/5 transition-colors group cursor-default">{children}</tr>;
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
