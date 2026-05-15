import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { registerPushToken, clearPushToken } from '../lib/pushNotifications';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'GARZON' | 'COCINA' | 'CAJERO' | 'BAR' | 'CLIENTE' | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole;
  restaurantId: string | null;
  loading: boolean;
  isPasswordRecovery: boolean;
  clearPasswordRecovery: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setRole(session.user.app_metadata.role || 'CLIENTE');
        setRestaurantId(session.user.app_metadata.restaurant_id || null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setRole(session.user.app_metadata.role || 'CLIENTE');
        setRestaurantId(session.user.app_metadata.restaurant_id || null);
        if (event === 'SIGNED_IN') {
          registerPushToken(session.user.id).catch(() => {});
        }
      } else {
        setRole(null);
        setRestaurantId(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = React.useMemo(() => ({
    session,
    user,
    role,
    restaurantId,
    loading,
    isPasswordRecovery,
    clearPasswordRecovery: () => setIsPasswordRecovery(false),
    signOut: async () => {
      try {
        const { data: { session: current } } = await supabase.auth.getSession();
        if (current?.user?.id) {
          clearPushToken(current.user.id).catch(() => {});
        }
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Error signing out:', error);
      } finally {
        setSession(null);
        setUser(null);
        setRole(null);
        setRestaurantId(null);
        setIsPasswordRecovery(false);
      }
    },
  }), [session, user, role, restaurantId, loading, isPasswordRecovery]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
