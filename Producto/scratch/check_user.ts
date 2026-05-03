import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function check() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('ERROR:', error.message);
    return;
  }
  const user = data?.users.find(u => u.email === 'admin@menubites.cl');
  if (user) {
    console.log('USER_ID:', user.id);
    console.log('APP_METADATA:', JSON.stringify(user.app_metadata));
    console.log('USER_METADATA:', JSON.stringify(user.user_metadata));
  } else {
    console.log('User not found');
  }
}
check();
