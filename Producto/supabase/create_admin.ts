import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Cargar variables de entorno desde la raíz
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSuperAdmin() {
  console.log('--- Iniciando creación de Super Administrador ---');
  
  const email = 'admin@menubites.cl';
  const password = 'adminPassword123!';

  // 1. Crear el usuario en la tabla de Auth
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Confirmar automáticamente
    user_metadata: { name: 'Admin Principal' },
    app_metadata: { role: 'SUPER_ADMIN' } // Rol requerido por el sistema
  });

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('ℹ️ El usuario ya existe. Intentando actualizar rol...');
      
      // Si el usuario ya existe, buscamos su ID por email
      const { data: listUser } = await supabase.auth.admin.listUsers();
      const existingUser = listUser?.users.find(u => u.email === email);

      if (existingUser) {
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          { app_metadata: { role: 'SUPER_ADMIN' } }
        );
        if (updateError) console.error('❌ Error al actualizar rol:', updateError.message);
        else console.log('✅ Rol de SUPER_ADMIN asignado con éxito al usuario existente.');
      }
    } else {
      console.error('❌ Error al crear usuario:', error.message);
    }
  } else {
    console.log('✅ Super Administrador creado con éxito:', data.user.email);
    console.log('ID:', data.user.id);
  }

  console.log('--- Proceso finalizado ---');
}

createSuperAdmin();
