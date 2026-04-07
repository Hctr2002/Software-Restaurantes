import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface UserIdentity {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'GARZON' | 'COCINA' | 'CLIENTE';
  restaurantId?: string;
  pushToken?: string;
}

interface AuthState {
  user: UserIdentity | null;
  isAuthenticated: boolean;
  setUser: (user: UserIdentity | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'menu-bites-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
