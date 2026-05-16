"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, Table, TableRow, TableCell } from "@menu-bites/ui";
import { TrendingUp } from "lucide-react";
import { formatPrice } from "@/app/[slug]/dashboard/_components/localShared";
import { formatShortDate } from "@/lib/reportUtils";
import { DayReport } from "@/hooks/useReportsData";

interface DailyPerformanceTableProps {
  reports: DayReport[];
  description: string;
}

export default function DailyPerformanceTable({ reports, description }: DailyPerformanceTableProps) {
  return (
    <Card className="glass rounded-[2.5rem] border-foreground/5 overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
             <CardTitle className="text-lg font-black text-foreground uppercase italic tracking-tight">Rendimiento Diario</CardTitle>
             <CardDescription className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table headers={["Fecha", "Pedidos", "Ingresos", "Avg"]}>
          {reports.every((r) => r.orders === 0) && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-foreground/40 py-12 font-bold uppercase tracking-widest text-xs">Sin ventas en este período.</TableCell>
            </TableRow>
          )}
          {reports.map((row) => (
            <TableRow key={row.date}>
              <TableCell className={`font-black text-[11px] uppercase tracking-tight italic ${row.orders === 0 ? "text-foreground/20" : "text-foreground"}`}>
                {formatShortDate(row.date)}
              </TableCell>
              <TableCell className="text-foreground/40 font-bold text-xs">
                <span style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{row.orders || "—"}</span>
              </TableCell>
              <TableCell className={`font-black text-sm italic ${row.orders > 0 ? 'text-primary' : 'text-foreground/20'}`}>
                <span style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{row.orders ? formatPrice(row.revenue) : "—"}</span>
              </TableCell>
              <TableCell className="font-bold text-foreground/30 text-[11px]">
                <span style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{row.orders ? formatPrice(row.avg) : "—"}</span>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </CardContent>
    </Card>
  );
}
