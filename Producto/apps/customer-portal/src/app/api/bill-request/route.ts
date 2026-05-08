import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  try {
    const { table_id, restaurant_id, table_number } = await req.json();

    if (!table_id || !restaurant_id) {
      return NextResponse.json({ error: 'Faltan parámetros obligatorios' }, { status: 400 });
    }

    // 1. Actualizar mesa
    const { error: tErr } = await supabaseAdmin
      .from('tables')
      .update({ bill_requested: true })
      .eq('id', table_id);

    if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });

    // 2. Crear Alerta para el staff
    await supabaseAdmin
      .from('alerts')
      .insert({
        id: (globalThis as any).crypto.randomUUID(),
        restaurant_id,
        table_number,
        type: 'BILL_REQUEST',
        message: `La mesa ${table_number} ha solicitado la cuenta.`,
        status: 'PENDING'
      });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
