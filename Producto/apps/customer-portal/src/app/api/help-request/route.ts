/**
 * API Route: POST /api/help-request
 * Registra la solicitud de asistencia de una mesa:
 * activa el flag help_requested = true en la tabla 'tables'.
 * Requiere: table_id, restaurant_id en el cuerpo.
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
    const { table_id, restaurant_id, table_number } = await req.json();

    if (!table_id || !restaurant_id) {
      return NextResponse.json({ error: 'Faltan parámetros obligatorios' }, { status: 400 });
    }

    // 1. Marcar mesa con solicitud de ayuda
    const { error } = await supabaseAdmin
      .from('tables')
      .update({ help_requested: true })
      .eq('id', table_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
