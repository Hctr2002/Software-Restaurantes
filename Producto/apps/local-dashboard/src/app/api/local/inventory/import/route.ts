/**
 * /api/local/inventory/import — Importación masiva de stock via CSV.
 * POST: Recibe texto CSV con columnas "id" y "stock_actual", actualiza cada fila en la DB
 * y retorna conteo de actualizaciones, errores por fila y lista de ítems bajo stock crítico.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, createServiceClient, ensureServiceConfig } from "@/lib/localApi";
import { LOW_STOCK_THRESHOLD } from "@menu-bites/auth";

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export async function POST(req: NextRequest) {
  const cfg = ensureServiceConfig();
  if (cfg) return cfg;

  const auth = await requireAdmin(req);
  if ("errorResponse" in auth) return auth.errorResponse;
  const { restaurantId } = auth;

  const text = await req.text();
  const lines = text.trim().split(/\r?\n/);

  if (lines.length < 2) {
    return NextResponse.json({ error: "CSV vacío o inválido" }, { status: 400 });
  }

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  const idIdx    = header.indexOf("id");
  const stockIdx = header.findIndex((h) => h === "stock_actual" || h === "stock");

  if (idIdx === -1 || stockIdx === -1) {
    return NextResponse.json(
      { error: 'El CSV debe tener las columnas "id" y "stock_actual"' },
      { status: 400 }
    );
  }

  const db = createServiceClient();
  let updated = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols  = parseCsvLine(line);
    const id    = cols[idIdx]?.trim();
    const rawStock = cols[stockIdx]?.trim();

    if (!id || !rawStock) continue;

    const stock = parseFloat(rawStock);
    if (isNaN(stock) || stock < 0) {
      errors.push(`Fila ${i + 1}: stock inválido ("${rawStock}")`);
      continue;
    }

    const { error } = await db
      .from("inventories")
      .update({ stock })
      .eq("id", id)
      .eq("restaurant_id", restaurantId);

    if (error) errors.push(`Fila ${i + 1}: ${error.message}`);
    else updated++;
  }

  const { data: critical } = await db
    .from("inventories")
    .select("name, stock, unit")
    .eq("restaurant_id", restaurantId)
    .lte("stock", LOW_STOCK_THRESHOLD)
    .order("stock", { ascending: true });

  return NextResponse.json({ updated, errors, critical: critical ?? [] });
}
