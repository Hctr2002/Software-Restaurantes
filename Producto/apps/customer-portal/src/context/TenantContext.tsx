'use client';

import { createContext, useContext } from 'react';

// Espejo del modelo Restaurant (solo campos públicos del portal)
export interface TenantRestaurant {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
}

interface TenantContextType {
  restaurant: TenantRestaurant;
}

const TenantContext = createContext<TenantContextType | null>(null);

/**
 * TenantProvider — Envuelve todas las páginas de /[restaurantSlug]/*
 * Provee el restaurante resuelto a todos los componentes hijos.
 */
export function TenantProvider({
  restaurant,
  children,
}: {
  restaurant: TenantRestaurant;
  children: React.ReactNode;
}) {
  return (
    <TenantContext.Provider value={{ restaurant }}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * useTenant — Hook para acceder al restaurante actual en cualquier página del portal.
 * Solo funciona dentro de un TenantProvider (es decir, bajo /[restaurantSlug]).
 * @example
 * const { restaurant } = useTenant();
 * // restaurant.id → restaurant_id para filtrar queries
 */
export function useTenant(): TenantContextType {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error(
      '[TenantContext] useTenant() debe usarse dentro de un TenantProvider. ' +
      'Asegúrate de estar en una ruta /[restaurantSlug]/*'
    );
  }
  return ctx;
}
