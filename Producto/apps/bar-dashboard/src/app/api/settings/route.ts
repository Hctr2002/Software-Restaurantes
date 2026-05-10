import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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
      cookieOptions: { name: 'sb-bar-session' },
    }
  );
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.app_metadata?.restaurant_id ?? null;
}

export async function GET() {
  const restaurantId = await getRestaurantId();
  if (!restaurantId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const db = serviceClient();
  const { data, error } = await db
    .from('kds_settings')
    .select('settings')
    .eq('restaurant_id', restaurantId)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const settings = data?.settings as any;
  if (settings && settings.BAR) {
    return NextResponse.json(settings.BAR);
  }
  
  // Si no hay configuración de BAR específica, devolvemos null o los settings raíz (si existen)
  // Pero para evitar colisiones con Cocina, si no tiene la llave BAR, asumimos que no tiene configuración de barra aún.
  return NextResponse.json(null);
}

export async function POST(req: NextRequest) {
  const restaurantId = await getRestaurantId();
  if (!restaurantId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const incomingSettings = await req.json();
  const db = serviceClient();

  // 1. Obtener settings actuales para no borrar lo de Cocina
  const { data: current } = await db
    .from('kds_settings')
    .select('settings')
    .eq('restaurant_id', restaurantId)
    .single();

  const finalSettings = {
    ...(current?.settings as any || {}),
    BAR: incomingSettings
  };

  const { data, error } = await db
    .from('kds_settings')
    .upsert({
      restaurant_id: restaurantId,
      settings: finalSettings,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'restaurant_id'
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data.settings.BAR);
}
