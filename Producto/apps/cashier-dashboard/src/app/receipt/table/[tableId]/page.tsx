import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { formatCLP, formatDateTime } from "@menu-bites/auth";
import { PrintControls } from "../../_components/PrintControls";

import { ReceiptActions } from "./ReceiptActions";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Consolida ítems repetidos en una sola línea agregada por nombre + precio unitario. */
function consolidateItems(orders: any[]): { name: string; quantity: number; unitPrice: number }[] {
  const map = new Map<string, { name: string; quantity: number; unitPrice: number }>();
  for (const order of orders) {
    for (const item of order.order_items ?? []) {
      const name = item.menu_items?.name ?? "Item";
      const unitPrice = Number(item.unit_price);
      const key = `${name}__${unitPrice}`;
      const existing = map.get(key);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        map.set(key, { name, quantity: item.quantity, unitPrice });
      }
    }
  }
  return Array.from(map.values());
}

export default async function ReceiptTablePage({
  params,
  searchParams,
}: {
  params: Promise<{ tableId: string }>;
  searchParams: Promise<{ rid?: string; tip?: string }>;
}) {
  const { tableId } = await params;
  const { rid: restaurantId, tip } = await searchParams;
  const isTipIncluded = tip === "true";

  if (!restaurantId) return notFound();

  const db = serviceClient();

  // Fetch table info
  const { data: table } = await db
    .from("tables")
    .select("number, label, current_session_id, restaurant_id")
    .eq("id", tableId)
    .single();

  if (!table) return notFound();

  const actualRestaurantId = table.restaurant_id;

  // Fetch restaurant info
  const { data: restaurant } = await db
    .from("restaurants")
    .select("name")
    .eq("id", actualRestaurantId)
    .single();

  // Fetch orders for this table or session
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let query = db
    .from("orders")
    .select("id, status, createdAt, order_items(quantity, unit_price, menu_items(name))")
    .eq("restaurant_id", actualRestaurantId)
    .gte("createdAt", today.toISOString());

  if (table.current_session_id) {
    query = query.eq("session_id", table.current_session_id);
  } else {
    query = query.eq("table_id", tableId);
  }

  const { data: orders, error } = await query.order("createdAt", { ascending: true });

  console.log("RECEIPT TABLE:", { tableId, restaurantId, count: orders?.length, error });

  const safeOrders      = orders ?? [];
  const consolidatedItems = consolidateItems(safeOrders);
  const subtotal        = consolidatedItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const tipAmount       = isTipIncluded ? subtotal * 0.1 : 0;
  const paymentRef      = null;
  const issuedAt        = safeOrders.at(-1)?.createdAt ?? new Date().toISOString();

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
          <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>COMPROBANTE DE PAGO</p>
        </div>

        {/* Meta */}
        <div style={{ borderTop: "1px dashed #d1d5db", borderBottom: "1px dashed #d1d5db", padding: "12px 0", marginBottom: 20 }}>
          <Row label="Mesa" value={`#${table.number}`} />
          <Row label="Fecha" value={formatDateTime(issuedAt)} />
          {paymentRef && <Row label="Ref. pago" value={paymentRef} />}
        </div>

        {/* Detalle consolidado de ítems */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 10, color: "#9ca3af", marginBottom: 10, fontWeight: 700, letterSpacing: 1 }}>
            DETALLE DE CONSUMO
          </p>

          {/* Header de columnas */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#9ca3af", marginBottom: 6, borderBottom: "1px solid #e5e7eb", paddingBottom: 4 }}>
            <span style={{ flex: 1 }}>DESCRIPCIÓN</span>
            <span style={{ width: 40, textAlign: "center" }}>CANT.</span>
            <span style={{ width: 65, textAlign: "right" }}>P/U</span>
            <span style={{ width: 70, textAlign: "right" }}>TOTAL</span>
          </div>

          {consolidatedItems.map((item, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6, alignItems: "baseline", color: "#111827" }}>
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

          <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 8, paddingTop: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#6b7280" }}>
              <span>{consolidatedItems.length} producto{consolidatedItems.length !== 1 ? "s" : ""} · {consolidatedItems.reduce((s, i) => s + i.quantity, 0)} unidades</span>
            </div>
          </div>
        </div>

        {/* Totals */}
        <div style={{ borderTop: "1px dashed #d1d5db", paddingTop: 12, marginBottom: 20 }}>
          <Row label="NETO" value={formatCLP(Math.round(subtotal / 1.19))} />
          <Row label="IVA (19%)" value={formatCLP(subtotal - Math.round(subtotal / 1.19))} />
          <Row label="TOTAL CONSUMO" value={formatCLP(subtotal)} />
          {isTipIncluded && <Row label="Propina sugerida (10%)" value={formatCLP(tipAmount)} />}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 18, marginTop: 8, color: "#111827" }}>
            <span>{isTipIncluded ? "TOTAL + Propina" : "TOTAL A PAGAR"}</span>
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
