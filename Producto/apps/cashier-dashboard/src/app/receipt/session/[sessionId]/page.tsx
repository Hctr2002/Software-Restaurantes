import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { formatCLP, formatDateTime } from "@menu-bites/auth";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function ReceiptSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ rid?: string }>;
}) {
  const { sessionId } = await params;
  const { rid: restaurantId } = await searchParams;

  if (!restaurantId) return notFound();

  const db = serviceClient();

  const { data: restaurant } = await db
    .from("restaurants")
    .select("name")
    .eq("id", restaurantId)
    .single();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: orders } = await db
    .from("orders")
    .select("id, status, createdAt, payment_reference, table_id, tables(number, label), order_items(quantity, unit_price, menu_items(name))")
    .eq("session_id", sessionId)
    .eq("restaurant_id", restaurantId)
    .eq("status", "DELIVERED")
    .gte("createdAt", today.toISOString())
    .order("createdAt", { ascending: true });

  if (!orders || orders.length === 0) return notFound();

  // Group by table_id to show per-table breakdown
  const tableMap = new Map<string, { tableNumber: number; label: string | null; items: any[] }>();
  for (const order of orders) {
    const key = order.table_id ?? "sin-mesa";
    if (!tableMap.has(key)) {
      tableMap.set(key, {
        tableNumber: (order as any).tables?.number ?? 0,
        label: (order as any).tables?.label ?? null,
        items: [],
      });
    }
    tableMap.get(key)!.items.push(...((order as any).order_items ?? []));
  }

  const tableGroups = Array.from(tableMap.values()).sort((a, b) => a.tableNumber - b.tableNumber);
  const tableNums   = tableGroups.map((g) => `#${g.tableNumber}`).join(" + ");
  const allItems    = orders.flatMap((o: any) => o.order_items ?? []);
  const subtotal    = allItems.reduce((s: number, i: any) => s + Number(i.unit_price) * i.quantity, 0);
  const tip         = subtotal * 0.1;
  const paymentRef  = orders.at(-1)?.payment_reference ?? null;
  const issuedAt    = orders.at(-1)?.createdAt ?? new Date().toISOString();

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .receipt { box-shadow: none; border: none; max-width: 100%; }
        }
        body { font-family: 'Courier New', monospace; background: #f4f4f4; margin: 0; padding: 16px; }
      `}</style>

      <div className="no-print" style={{ display: "flex", gap: 12, justifyContent: "center", padding: "16px 0 0" }}>
        <button
          onClick={() => window.print()}
          style={{ padding: "8px 20px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 }}
        >
          Imprimir
        </button>
        <button
          onClick={() => window.close()}
          style={{ padding: "8px 20px", background: "#6b7280", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 }}
        >
          Cerrar
        </button>
      </div>

      <div className="receipt" style={{
        maxWidth: 380, margin: "16px auto", background: "#fff",
        padding: "32px 28px", borderRadius: 8,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)", fontFamily: "'Courier New', monospace",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <p style={{ fontSize: 20, fontWeight: 900, margin: "0 0 4px", letterSpacing: 2 }}>
            {restaurant?.name?.toUpperCase() ?? "RESTAURANTE"}
          </p>
          <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>COMPROBANTE UNIFICADO</p>
        </div>

        {/* Meta */}
        <div style={{ borderTop: "1px dashed #d1d5db", borderBottom: "1px dashed #d1d5db", padding: "12px 0", marginBottom: 20 }}>
          <Row label="Mesas" value={tableNums} />
          <Row label="Fecha" value={formatDateTime(issuedAt)} />
          {paymentRef && <Row label="Ref. pago" value={paymentRef} />}
        </div>

        {/* Items por mesa */}
        {tableGroups.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, marginBottom: 6 }}>
              — MESA {group.tableNumber}{group.label ? ` (${group.label})` : ""} —
            </p>
            {group.items.map((item: any, ii: number) => (
              <div key={ii} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ flex: 1 }}>
                  {item.quantity}x {item.menu_items?.name ?? "Item"}
                </span>
                <span style={{ fontWeight: 700, marginLeft: 8 }}>
                  {formatCLP(Number(item.unit_price) * item.quantity)}
                </span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 11, color: "#6b7280", marginTop: 4 }}>
              Subtotal: {formatCLP(group.items.reduce((s: number, i: any) => s + Number(i.unit_price) * i.quantity, 0))}
            </div>
          </div>
        ))}

        {/* Totals */}
        <div style={{ borderTop: "1px dashed #d1d5db", paddingTop: 12, marginBottom: 20 }}>
          <Row label="Subtotal total" value={formatCLP(subtotal)} />
          <Row label="Propina sugerida (10%)" value={formatCLP(tip)} />
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 18, marginTop: 8 }}>
            <span>TOTAL</span>
            <span>{formatCLP(subtotal + tip)}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", borderTop: "1px dashed #d1d5db", paddingTop: 16 }}>
          <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 4px" }}>Gracias por su visita</p>
          <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>Menu Bites · Sistema de Gestión</p>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3, color: "#374151" }}>
      <span style={{ color: "#6b7280" }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
