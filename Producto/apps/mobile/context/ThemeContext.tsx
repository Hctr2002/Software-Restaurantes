import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { MB_COLORS as DEFAULT_COLORS } from '../constants/MB_Theme';

interface ThemeColors {
  navy: string;
  brandAccent: string;
  secondary: string;
  accent: string;
  sage: string;
  cream: string;
  glass: string;
  glassHeavy: string;
  muted: string;
  cardBackground: string;
  text: string;
}

interface ThemeContextType {
  colors: ThemeColors;
  logoUrl: string | null;
  loading: boolean;
  refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function RestaurantThemeProvider({ children }: { children: React.ReactNode }) {
  const { restaurantId } = useAuth();
  const [colors, setColors] = useState<ThemeColors>(DEFAULT_COLORS as any);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTheme = useCallback(async () => {
    if (!restaurantId) {
      setColors(DEFAULT_COLORS as any);
      setLogoUrl(null);
      setLoading(false);
      return;
    }

    try {
      const { data: rows, error } = await supabase
        .from('restaurant_themes')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      const data = rows?.[0] ?? null;

      if (data) {
        setColors({
          navy: data.background_color || DEFAULT_COLORS.navy,
          brandAccent: data.primary_color || DEFAULT_COLORS.brandAccent,
          secondary: data.secondary_color || data.primary_color || DEFAULT_COLORS.brandAccent,
          accent: data.accent_color || data.primary_color || DEFAULT_COLORS.brandAccent,
          sage: DEFAULT_COLORS.sage, 
          cream: data.text_color || DEFAULT_COLORS.cream,
          text: data.text_color || DEFAULT_COLORS.cream,
          glass: data.card_background || DEFAULT_COLORS.glass,
          glassHeavy: 'rgba(255, 255, 255, 0.1)',
          muted: 'rgba(255, 255, 255, 0.4)',
          cardBackground: data.card_background || DEFAULT_COLORS.glass
        });
        setLogoUrl(data.logo_url);
      } else {
        setColors(DEFAULT_COLORS as any);
        setLogoUrl(null);
      }
    } catch (err) {
      console.error('[ThemeContext] Error fetching theme:', err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchTheme();

    if (!restaurantId) return;

    // Suscripción en tiempo real a cambios de branding
    const channel = supabase
      .channel(`theme-updates-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_themes',
          filter: `restaurant_id=eq.${restaurantId}`
        },
        () => {
          fetchTheme();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  return (
    <ThemeContext.Provider value={{ colors, logoUrl, loading, refreshTheme: fetchTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a RestaurantThemeProvider');
  }
  return context;
}
