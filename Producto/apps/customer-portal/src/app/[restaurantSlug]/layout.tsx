'use client';

/**
 * Layout del tenant — /[restaurantSlug]/*
 *
 * Client Component: evita dependencia de @supabase/ssr.
 * Usa useParams() para leer el slug y getRestaurantBySlug() con el cliente browser.
 *
 * Responsabilidades:
 * 1. Leer el slug de la URL
 * 2. Buscar el restaurante en Supabase (anon key, política public_read_restaurants)
 * 3. Si no existe o no está ACTIVE → muestra 404 inline
 * 4. Si existe → envuelve hijos en TenantProvider con el restaurante resuelto
 */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { TenantProvider, type TenantRestaurant } from '@/context/TenantContext';
import { getRestaurantBySlug } from '@/lib/tenant';

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();

  const [restaurant, setRestaurant] = useState<TenantRestaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!restaurantSlug) return;

    async function resolve() {
      console.log('[TenantLayout] Buscando slug:', restaurantSlug);
      console.log('[TenantLayout] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      const data = await getRestaurantBySlug(restaurantSlug);
      console.log('[TenantLayout] Resultado:', data);
      if (!data) {
        setNotFound(true);
      } else {
        setRestaurant(data);
      }
      setLoading(false);
    }

    resolve();
  }, [restaurantSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-sage border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !restaurant) {
    return (
      <div className="min-h-screen bg-navy-dark flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-black text-sand mb-3">404</h1>
        <p className="text-sage text-lg font-semibold mb-2">Restaurante no encontrado</p>
        <p className="text-sand/40 text-sm">
          El restaurante <span className="text-sage/70 font-mono">"{restaurantSlug}"</span> no existe
          o no está activo en este momento.
        </p>
      </div>
    );
  }

  return (
    <TenantProvider restaurant={restaurant}>
      {children}
    </TenantProvider>
  );
}
