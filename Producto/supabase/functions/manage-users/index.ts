import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("Iniciando petición a manage-users...");
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No se proporcionó el encabezado de autorización');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) throw new Error('No autorizado');

    const { data: profile, error: profileError } = await supabaseClient
      .from('users')
      .select('role, restaurant_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) throw new Error('No se encontró el perfil del administrador');
    if (profile.role !== 'ADMIN') throw new Error('Solo los administradores pueden gestionar usuarios');

    const body = await req.json();
    const { email, password, role, action, id } = body;
    const restaurantId = profile.restaurant_id;
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (action === 'create') {
      console.log(`Creando usuario Auth para ${email}...`);
      const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role, restaurant_id: restaurantId }
      })

      if (createError) throw createError;

      console.log(`Sincronizando tabla users para ${email} (upsert)...`);
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: authUser.user.id,
          email,
          role,
          restaurant_id: restaurantId
        })

      if (dbError) throw dbError;

      return new Response(JSON.stringify({ success: true, message: 'User created and synced' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (action === 'delete') {
      console.log(`Eliminando usuario ${id} de DB y Auth...`);
      await supabaseAdmin.from('users').delete().eq('id', id);
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id)
      if (deleteError) throw deleteError;

      return new Response(JSON.stringify({ success: true, message: 'User deleted' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    throw new Error(`Acción '${action}' no válida`);

  } catch (error: any) {
    console.error("ERROR:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
