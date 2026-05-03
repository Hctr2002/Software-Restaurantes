import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import CryptoJS from 'crypto-js';

export interface UserIdentity {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'GARZON' | 'COCINA' | 'CAJERO' | 'CLIENTE';
  restaurantId?: string;
  pushToken?: string;
  user_metadata?: any;
}

interface AuthState {
  user: UserIdentity | null;
  isAuthenticated: boolean;
  setUser: (user: UserIdentity | null) => void;
  logout: () => void;
}

const AUTH_STORAGE_KEY = 'menu-bites-auth-storage';

function getEncryptionKey() {
  if (typeof window === 'undefined') {
    return 'menu-bites-fallback-key';
  }

  const dynamicPart = `${window.location.hostname}:${navigator.userAgent}`;
  return `${process.env.NEXT_PUBLIC_AUTH_CACHE_KEY || 'menu-bites-auth'}:${dynamicPart}`;
}

const secureStorage = {
  getItem: (name: string) => {
    const encryptedValue = localStorage.getItem(name);
    if (!encryptedValue) return null;

    try {
      const bytes = CryptoJS.AES.decrypt(encryptedValue, getEncryptionKey());
      const decryptedValue = bytes.toString(CryptoJS.enc.Utf8);
      return decryptedValue || null;
    } catch {
      localStorage.removeItem(name);
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    const encryptedValue = CryptoJS.AES.encrypt(value, getEncryptionKey()).toString();
    localStorage.setItem(name, encryptedValue);
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
