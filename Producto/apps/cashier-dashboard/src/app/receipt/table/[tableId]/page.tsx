import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { formatCLP, formatDateTime } from "@menu-bites/auth";

import { ReceiptActions } from "./ReceiptActions";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function ReceiptTablePage({
  params,
  searchParams,
}: {
  params: Promise<{ tableId: string }>;
  searchParams: Promise<{ rid?: string }>;
}) {
  const { tableId } = await params;
  const { rid: restaurantId } = await searchParams;

  if (!restaurantId) return notFound();

  const db = serviceClient();

  // Fetch table info
  const { data: table } = await db
    .from("tables")
    .select("number, label")
    .eq("id", tableId)
    .eq("restaurant_id", restaurantId)
    .single();

  if (!table) return notFound();

  // Fetch restaurant info
  const { data: restaurant } = await db
    .from("restaurants")
    .select("name")
    .eq("id", restaurantId)
    .single();

  // Fetch today's DELIVERED orders for this table
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: orders } = await db
    .from("orders")
    .select("id, status, createdAt, payment_reference, order_items(quantity, unit_price, menu_items(name))")
    .eq("table_id", tableId)
    .eq("restaurant_id", restaurantId)
    .in("status", ["DELIVERED", "COMPLETED"])
    .gte("createdAt", today.toISOString())
    .order("createdAt", { ascending: true });

  const safeOrders = orders ?? [];
  const allItems   = safeOrders.flatMap((o: any) => o.order_items ?? []);
  const subtotal   = allItems.reduce((s: number, i: any) => s + Number(i.unit_price) * i.quantity, 0);
  const tip        = subtotal * 0.1;
  const paymentRef = safeOrders.at(-1)?.payment_reference ?? null;
  const issuedAt   = safeOrders.at(-1)?.createdAt ?? new Date().toISOString();

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

      <ReceiptActions />

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
          <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>COMPROBANTE DE PAGO</p>
        </div>

        {/* Meta */}
        <div style={{ borderTop: "1px dashed #d1d5db", borderBottom: "1px dashed #d1d5db", padding: "12px 0", marginBottom: 20 }}>
          <Row label="Mesa" value={`#${table.number}${table.label ? ` — ${table.label}` : ""}`} />
          <Row label="Fecha" value={formatDateTime(issuedAt)} />
          {paymentRef && <Row label="Ref. pago" value={paymentRef} />}
        </div>

        {/* Items */}
        <div style={{ marginBottom: 20 }}>
          {safeOrders.map((order: any, oi: number) => (
            <div key={order.id}>
              {safeOrders.length > 1 && (
                <p style={{ fontSize: 10, color: "#9ca3af", marginBottom: 6, marginTop: oi > 0 ? 12 : 0 }}>
                  — PEDIDO {oi + 1} —
                </p>
              )}
              {(order.order_items ?? []).map((item: any, ii: number) => (
                <div key={ii} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ flex: 1 }}>
                    {item.quantity}x {item.menu_items?.name ?? "Item"}
                  </span>
                  <span style={{ fontWeight: 700, marginLeft: 8 }}>
                    {formatCLP(Number(item.unit_price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{ borderTop: "1px dashed #d1d5db", paddingTop: 12, marginBottom: 20 }}>
          <Row label="Subtotal" value={formatCLP(subtotal)} />
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
