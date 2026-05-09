"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, Table, TableRow, TableCell } from "@menu-bites/ui";
import { UtensilsCrossed } from "lucide-react";
import { formatPrice } from "@/app/[slug]/dashboard/_components/localShared";
import { TopItem } from "@/hooks/useReportsData";

interface TopItemsTableProps {
  items: TopItem[];
}

export default function TopItemsTable({ items }: TopItemsTableProps) {
  return (
    <Card className="glass rounded-[2.5rem] border-white/5 overflow-hidden">
      <CardHeader className="p-8 pb-4">
         <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
             <CardTitle className="text-lg font-black text-foreground uppercase italic tracking-tight">Favoritos del Público</CardTitle>
             <CardDescription className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Los 10 más pedidos</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table headers={["Plato", "Ventas", "Ingresos"]}>
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-foreground/40 py-12 font-bold uppercase tracking-widest text-xs">Sin platos vendidos.</TableCell>
            </TableRow>
          )}
          {items.map((item, i) => (
            <TableRow key={item.name}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-foreground/20 italic w-4">#{i + 1}</span>
                  <span className="font-black text-foreground text-xs uppercase italic tracking-tight">{item.name}</span>
                </div>
              </TableCell>
              <TableCell><span className="font-black text-amber-500 text-sm italic">{item.count}x</span></TableCell>
              <TableCell className="font-bold text-foreground/40 text-xs">{formatPrice(item.revenue)}</TableCell>
            </TableRow>
          ))}
        </Table>
      </CardContent>
    </Card>
  );
}
