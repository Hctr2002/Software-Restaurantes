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
      cookieOptions: { name: 'sb-kds-session' },
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
  if (!settings) return NextResponse.json(null);

  // Si existe la llave KITCHEN, la devolvemos.
  if (settings.KITCHEN) {
    return NextResponse.json(settings.KITCHEN);
  }

  // Si no existe KITCHEN pero hay BAR, asumimos que los settings raíz ya no son para cocina.
  if (settings.BAR) {
    return NextResponse.json(null);
  }

  // Fallback: Si no hay KITCHEN ni BAR, devolvemos el objeto raíz (compatibilidad con versiones anteriores)
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const restaurantId = await getRestaurantId();
  if (!restaurantId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const incomingSettings = await req.json();
  const db = serviceClient();

  // 1. Obtener settings actuales para no borrar lo de Bar
  const { data: current } = await db
    .from('kds_settings')
    .select('settings')
    .eq('restaurant_id', restaurantId)
    .single();

  const finalSettings = {
    ...(current?.settings as any || {}),
    KITCHEN: incomingSettings
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

  return NextResponse.json(data.settings.KITCHEN);
}
