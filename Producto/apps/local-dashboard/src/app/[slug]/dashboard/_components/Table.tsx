"use client";

import React from "react";

interface TableProps {
  headers: string[];
  children: React.ReactNode;
}

export function Table({ headers, children }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/30">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-slate-800/50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-800">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-6 py-4 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">{children}</tbody>
      </table>
    </div>
  );
}

export function TableRow({ children }: { children: React.ReactNode }) {
  return <tr className="hover:bg-slate-800/30 transition-colors group">{children}</tr>;
}

export function TableCell({ children, className = "", colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}
