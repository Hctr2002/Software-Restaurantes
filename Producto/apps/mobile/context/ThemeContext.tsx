import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { MB_COLORS as DEFAULT_COLORS } from '../constants/MB_Theme';

export interface ThemeColors {
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
  isLight: boolean;
  refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function isLightColor(hex: string): boolean {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

export function RestaurantThemeProvider({ children }: { children: React.ReactNode }) {
  const { restaurantId } = useAuth();
  const [colors, setColors] = useState<ThemeColors>(DEFAULT_COLORS as any);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLight, setIsLight] = useState(false);

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
        const bgColor = data.background_color || DEFAULT_COLORS.navy;
        const lightBg = isLightColor(bgColor);
        setIsLight(lightBg);
        const muted = lightBg ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.4)';
        const glassHeavy = lightBg ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';

        setColors({
          navy: bgColor,
          brandAccent: data.primary_color || DEFAULT_COLORS.brandAccent,
          secondary: data.secondary_color || data.primary_color || DEFAULT_COLORS.brandAccent,
          accent: data.accent_color || data.primary_color || DEFAULT_COLORS.brandAccent,
          sage: DEFAULT_COLORS.sage,
          cream: data.text_color || DEFAULT_COLORS.cream,
          text: data.text_color || DEFAULT_COLORS.cream,
          glass: data.card_background || DEFAULT_COLORS.glass,
          glassHeavy,
          muted,
          cardBackground: data.card_background || DEFAULT_COLORS.glass
        });
        setLogoUrl(data.logo_url);
      } else {
        setColors(DEFAULT_COLORS as any);
        setLogoUrl(null);
        setIsLight(false);
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
    <ThemeContext.Provider value={{ colors, logoUrl, loading, isLight, refreshTheme: fetchTheme }}>
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
