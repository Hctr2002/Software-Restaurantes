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

  if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data?.settings ?? null);
}

export async function POST(req: NextRequest) {
  const restaurantId = await getRestaurantId();
  if (!restaurantId) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const settings = await req.json();

  const db = serviceClient();
  const { data, error } = await db
    .from('kds_settings')
    .upsert({
      restaurant_id: restaurantId,
      settings: settings,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'restaurant_id'
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data.settings);
}
