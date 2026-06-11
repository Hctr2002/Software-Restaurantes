import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { formatCLP, formatDateTime } from "@menu-bites/auth";
import { PrintControls } from "../../_components/PrintControls";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Consolida ítems repetidos en una sola línea agregada por nombre + precio unitario. */
function consolidateItems(items: any[]): { name: string; quantity: number; unitPrice: number }[] {
  const map = new Map<string, { name: string; quantity: number; unitPrice: number }>();
  for (const item of items) {
    const name = item.menu_items?.name ?? "Item";
    const unitPrice = Number(item.unit_price) || 0;
    const quantity = Number(item.quantity) || 0;
    const key = `${name}__${unitPrice}`;
    const existing = map.get(key);
    if (existing) {
      existing.quantity += quantity;
    } else {
      map.set(key, { name, quantity, unitPrice });
    }
  }
  return Array.from(map.values());
}

export default async function ReceiptSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ rid?: string; tip?: string; ref?: string }>;
}) {
  const { sessionId } = await params;
  const { rid: restaurantId, tip, ref } = await searchParams;
  const isTipIncluded = tip === "true";

  if (!restaurantId) return notFound();

  const db = serviceClient();

  const { data: restaurant } = await db
    .from("restaurants")
    .select("name")
    .eq("id", restaurantId)
    .single();

  const { data: orders } = await db
    .from("orders")
    .select("id, status, createdAt, restaurant_id, table_id, tables(number, label), order_items(quantity, unit_price, menu_items(name))")
    .eq("session_id", sessionId)
    .eq("restaurant_id", restaurantId)
    .order("createdAt", { ascending: true });

  if (!orders || orders.length === 0) return notFound();

  // Validar que las ordenes pertenecen al restaurante indicado en el query param rid.
  // Esta comprobacion impide que una URL manipulada con un rid distinto exponga
  // datos de otro tenant, incluso si el sessionId fuera conocido por un tercero.
  const actualRestaurantId = (orders[0] as any).restaurant_id;
  if (actualRestaurantId !== restaurantId) return notFound();

  // Group by table_id to show per-table breakdown
  const billableOrders = orders.filter((o: any) => o.status !== "REJECTED");

  const tableMap = new Map<string, { tableNumber: number; label: string | null; items: any[] }>();
  for (const order of billableOrders) {
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
  const allItems    = billableOrders.flatMap((o: any) => o.order_items ?? []);
  const subtotal    = allItems.reduce((s: number, i: any) => s + (Number(i.unit_price) || 0) * (Number(i.quantity) || 0), 0);
  const tipAmount   = isTipIncluded ? subtotal * 0.1 : 0;
  const paymentRef  = ref || null;
  const issuedAt    = billableOrders.at(-1)?.createdAt ?? orders.at(-1)?.createdAt ?? new Date().toISOString();

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .receipt { box-shadow: none; border: none; max-width: 100%; }
        }
        body { font-family: 'Courier New', monospace; background: #f4f4f4; margin: 0; padding: 16px; color: #111827; }
      `}</style>

      <PrintControls />

      <div className="receipt" style={{
        maxWidth: 380, margin: "16px auto", background: "#fff",
        padding: "32px 28px", borderRadius: 8,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)", fontFamily: "'Courier New', monospace",
        color: "#111827",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <p style={{ fontSize: 20, fontWeight: 900, margin: "0 0 4px", letterSpacing: 2, color: "#111827" }}>
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

        {/* Items consolidados por mesa */}
        {tableGroups.map((group, gi) => {
          const consolidated = consolidateItems(group.items);
          const groupSubtotal = consolidated.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

          return (
            <div key={gi} style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10, color: "#4b5563", fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>
                — MESA {group.tableNumber} —
              </p>

              {/* Header de columnas */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#4b5563", marginBottom: 6, borderBottom: "1px solid #e5e7eb", paddingBottom: 4 }}>
                <span style={{ flex: 1 }}>DESCRIPCIÓN</span>
                <span style={{ width: 40, textAlign: "center" }}>CANT.</span>
                <span style={{ width: 65, textAlign: "right" }}>P/U</span>
                <span style={{ width: 70, textAlign: "right" }}>TOTAL</span>
              </div>

              {consolidated.map((item, ii) => (
                <div key={ii} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6, alignItems: "baseline", color: "#111827" }}>
                  <span style={{ flex: 1, fontWeight: 700, color: "#111827" }}>
                    {item.name}
                  </span>
                  <span style={{ width: 40, textAlign: "center", fontSize: 11, color: "#6b7280" }}>
                    {item.quantity}
                  </span>
                  <span style={{ width: 65, textAlign: "right", fontSize: 10, color: "#6b7280" }}>
                    {formatCLP(item.unitPrice)}
                  </span>
                  <span style={{ width: 70, textAlign: "right", fontWeight: 700, color: "#111827" }}>
                    {formatCLP(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}

              <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 11, color: "#6b7280", marginTop: 4, borderTop: "1px solid #e5e7eb", paddingTop: 4 }}>
                Subtotal Mesa: {formatCLP(groupSubtotal)}
              </div>
            </div>
          );
        })}

        {/* Totals */}
        <div style={{ borderTop: "1px dashed #d1d5db", paddingTop: 12, marginBottom: 20 }}>
          <Row label="NETO" value={formatCLP(Math.round(subtotal / 1.19))} />
          <Row label="IVA (19%)" value={formatCLP(subtotal - Math.round(subtotal / 1.19))} />
          <Row label="TOTAL CONSUMO" value={formatCLP(subtotal)} />
          {isTipIncluded && <Row label="Propina acordada (10%)" value={formatCLP(tipAmount)} />}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 18, marginTop: 8, color: "#111827" }}>
            <span>{isTipIncluded ? "TOTAL A PAGAR (propina incluida)" : "TOTAL A PAGAR"}</span>
            <span>{formatCLP(subtotal + tipAmount)}</span>
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
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3, color: "#111827" }}>
      <span style={{ color: "#4b5563" }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

