"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, Table, TableRow, TableCell } from "@menu-bites/ui";
import { Award } from "lucide-react";
import { formatPrice } from "@/app/[slug]/dashboard/_components/localShared";
import { medalColor } from "@/lib/reportUtils";
import { GarzonReport } from "@/hooks/useReportsData";

interface TeamRankingTableProps {
  reports: GarzonReport[];
}

export default function TeamRankingTable({ reports }: TeamRankingTableProps) {
  return (
    <Card className="glass rounded-[2.5rem] border-white/5 overflow-hidden">
      <CardHeader className="p-8 pb-4">
         <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
            <Award className="w-5 h-5" />
          </div>
          <div>
             <CardTitle className="text-lg font-black text-foreground uppercase italic tracking-tight">Ranking de Equipo</CardTitle>
             <CardDescription className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Top rendimiento por garzón</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table headers={["#", "Garzón", "Pedidos", "Ingresos"]}>
          {reports.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-foreground/40 py-12 font-bold uppercase tracking-widest text-xs">
                Sin datos registrados.
              </TableCell>
            </TableRow>
          )}
          {reports.map((row, i) => (
            <TableRow key={row.email}>
              <TableCell>
                <span className={`text-sm font-black italic ${medalColor(i)}`}>#{i + 1}</span>
              </TableCell>
              <TableCell className="font-black text-foreground text-xs uppercase italic tracking-tight">
                {row.email.split("@")[0]}
              </TableCell>
              <TableCell className="text-foreground/40 font-bold text-xs">
                <span style={{ fontFamily: 'var(--font-accent)' }}>{row.orders}</span>
              </TableCell>
              <TableCell className="font-black text-emerald-500 text-sm italic">
                <span style={{ fontFamily: 'var(--font-accent)' }}>{formatPrice(row.revenue)}</span>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </CardContent>
    </Card>
  );
}
