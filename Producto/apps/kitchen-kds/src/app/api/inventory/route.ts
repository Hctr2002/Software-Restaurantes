import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CRITICAL_STOCK_THRESHOLD as CRITICAL_THRESHOLD } from '@menu-bites/auth';

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getRestaurantId(): Promise<string | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
      cookieOptions: { name: 'sb-kds-session' },
    }
  );
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.app_metadata?.restaurant_id ?? null;
}

// GET /api/inventory — exporta inventario como CSV
export async function GET() {
  const restaurantId = await getRestaurantId();
  if (!restaurantId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const db = serviceClient();
  const { data, error } = await db
    .from('inventories')
    .select('id, name, stock, unit')
    .eq('restaurant_id', restaurantId)
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const csvLines = [
    'id,nombre,stock_actual,unidad',
    ...rows.map((r) =>
      `${r.id},"${r.name.replace(/"/g, '""')}",${Number(r.stock).toFixed(2)},${r.unit}`
    ),
  ];
  const csv = csvLines.join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="inventario.csv"',
    },
  });
}

// POST /api/inventory — importa CSV y actualiza solo el campo stock
export async function POST(req: NextRequest) {
  const restaurantId = await getRestaurantId();
  if (!restaurantId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const text = await req.text();
  const lines = text.trim().split('\n');

  if (lines.length < 2) {
    return NextResponse.json({ error: 'CSV vacío o inválido' }, { status: 400 });
  }

  // Parsear columnas del header (case-insensitive)
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
  const idIdx    = header.indexOf('id');
  const stockIdx = header.findIndex((h) => h === 'stock_actual' || h === 'stock');

  if (idIdx === -1 || stockIdx === -1) {
    return NextResponse.json(
      { error: 'CSV debe tener columnas "id" y "stock_actual"' },
      { status: 400 }
    );
  }

  const db = serviceClient();
  let updated = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parse respetando campos entre comillas
    const cols = parseCsvLine(line);
    const id    = cols[idIdx]?.trim();
    const stockRaw = cols[stockIdx]?.trim();

    if (!id || stockRaw === undefined || stockRaw === '') continue;

    const stock = parseFloat(stockRaw);
    if (isNaN(stock) || stock < 0) {
      errors.push(`Fila ${i + 1}: stock inválido ("${stockRaw}")`);
      continue;
    }

    const { error } = await db
      .from('inventories')
      .update({ stock })
      .eq('id', id)
      .eq('restaurant_id', restaurantId);

    if (error) {
      errors.push(`Fila ${i + 1}: ${error.message}`);
    } else {
      updated++;
    }
  }

  // Calcular ítems críticos post-update
  const { data: criticalItems } = await db
    .from('inventories')
    .select('name, stock, unit')
    .eq('restaurant_id', restaurantId)
    .lte('stock', CRITICAL_THRESHOLD)
    .order('stock', { ascending: true });

  return NextResponse.json({
    updated,
    errors,
    critical: criticalItems ?? [],
    criticalThreshold: CRITICAL_THRESHOLD,
  });
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
