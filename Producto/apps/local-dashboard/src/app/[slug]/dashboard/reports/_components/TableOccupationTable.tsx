"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, Table, TableRow, TableCell } from "@menu-bites/ui";
import { TableProperties } from "lucide-react";
import { formatPrice } from "@/app/[slug]/dashboard/_components/localShared";
import { TableReport } from "@/hooks/useReportsData";

interface TableOccupationTableProps {
  reports: TableReport[];
}

export default function TableOccupationTable({ reports }: TableOccupationTableProps) {
  return (
    <Card className="glass rounded-[2.5rem] border-white/5 overflow-hidden">
      <CardHeader className="p-8 pb-4">
         <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
            <TableProperties className="w-5 h-5" />
          </div>
          <div>
             <CardTitle className="text-lg font-black text-foreground uppercase italic tracking-tight">Ocupación por Mesa</CardTitle>
             <CardDescription className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Rendimiento por zona</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table headers={["Mesa", "Pedidos", "Total"]}>
          {reports.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-foreground/40 py-12 font-bold uppercase tracking-widest text-xs">Sin datos de mesas.</TableCell>
            </TableRow>
          )}
          {reports.map((row) => (
            <TableRow key={row.number}>
              <TableCell className="font-black text-foreground text-sm uppercase italic tracking-tight">Mesa {row.number}</TableCell>
              <TableCell className="text-foreground/40 font-bold text-xs">{row.orders}</TableCell>
              <TableCell className="font-black text-primary text-sm italic">{formatPrice(row.revenue)}</TableCell>
            </TableRow>
          ))}
        </Table>
      </CardContent>
    </Card>
  );
}
