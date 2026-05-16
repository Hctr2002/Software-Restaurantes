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
import { getRestaurantBySlug, getThemeByRestaurant, type RestaurantTheme } from '@/lib/tenant';
import { supabase } from '@menu-bites/auth';
import { RestaurantThemeProvider } from '@menu-bites/ui';

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();

  const [restaurant, setRestaurant] = useState<TenantRestaurant | null>(null);
  const [theme, setTheme] = useState<RestaurantTheme | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!restaurantSlug) return;

    async function resolve() {
      const data = await getRestaurantBySlug(restaurantSlug);
      if (!data) {
        setNotFound(true);
      } else {
        setRestaurant(data);
        const themeData = await getThemeByRestaurant(data.id);
        if (themeData) {
          setTheme(themeData);
          // Cachear el tema en localStorage para eliminarlo FOUC en la próxima visita
          try { localStorage.setItem('mb-theme-' + restaurantSlug, JSON.stringify(themeData)); } catch {}
        }
      }
      setLoading(false);
    }

    resolve();
  }, [restaurantSlug]);

  useEffect(() => {
    if (!restaurant?.id) return;
    const restaurantId = restaurant.id;

    const channel = supabase
      .channel(`portal-theme-${restaurantId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'restaurant_themes', filter: `restaurant_id=eq.${restaurantId}` },
        async (payload) => {
          if (payload.new.is_active) {
            const updated = await getThemeByRestaurant(restaurantId);
            if (updated) {
              setTheme(updated);
              try { localStorage.setItem('mb-theme-' + restaurant.slug, JSON.stringify(updated)); } catch {}
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [restaurant?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !restaurant) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl font-black text-foreground mb-3">404</h1>
        <p className="text-primary text-lg font-semibold mb-2">Restaurante no encontrado</p>
        <p className="text-foreground/40 text-sm">
          El restaurante <span className="text-primary/70 font-mono">"{restaurantSlug}"</span> no existe
          o no está activo en este momento.
        </p>
      </div>
    );
  }

  return (
    <RestaurantThemeProvider theme={theme} isGlobal={true}>
      <TenantProvider restaurant={restaurant}>
        {children}
      </TenantProvider>
    </RestaurantThemeProvider>
  );
}
