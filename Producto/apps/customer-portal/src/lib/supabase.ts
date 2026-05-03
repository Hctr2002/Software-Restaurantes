import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Ensure .env is configured.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper to get the public URL for an image stored in Supabase Storage.
 * Handles both full URLs and relative storage paths.
 */
export const getPublicImageUrl = (path: string | null) => {
  if (!path) return '/placeholder-food.jpg';
  if (path.startsWith('http')) return path;
  
  const { data } = supabase.storage
    .from('menu-images')
    .getPublicUrl(path);
    
  return data.publicUrl;
};
