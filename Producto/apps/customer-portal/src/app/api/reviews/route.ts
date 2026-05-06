import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const { order_id, restaurant_id, table_id, rating, comment } = await req.json();

    if (!order_id || !restaurant_id || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('reviews').insert({
      order_id,
      restaurant_id,
      table_id:   table_id ?? null,
      rating:     Number(rating),
      comment:    comment?.trim() || null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
