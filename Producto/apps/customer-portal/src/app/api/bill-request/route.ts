/**
 * API Route: POST /api/bill-request
 * Registra la solicitud de cuenta de una mesa:
 * 1. Marca la mesa con bill_requested = true.
 * 2. Inserta una alerta tipo BILL_REQUEST para notificar al staff.
 * Requiere: table_id, restaurant_id, table_number en el cuerpo.
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  try {
    const { table_id, restaurant_id, table_number, tip_included } = await req.json();

    if (!table_id || !restaurant_id) {
      return NextResponse.json({ error: 'Faltan parámetros obligatorios' }, { status: 400 });
    }

    // 1. Actualizar mesa — el cliente decide la propina al pedir la cuenta.
    const { error: tErr } = await supabaseAdmin
      .from('tables')
      .update({ bill_requested: true, tip_included: !!tip_included })
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
