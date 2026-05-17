/**
 * index.ts — Store de autenticación del package @menu-bites/store.
 * Implementa useAuthStore con Zustand + persist middleware sobre un almacenamiento
 * AES-encriptado en localStorage. La clave de cifrado se deriva de hostname + userAgent
 * para dificultar la extracción directa del token desde DevTools.
 *
 * No usar este store directamente en lógica de servidor (SSR): retorna datos vacíos
 * cuando window es undefined (getEncryptionKey retorna un fallback).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import CryptoJS from 'crypto-js';

export interface UserIdentity {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'GARZON' | 'COCINA' | 'CAJERO' | 'CLIENTE' | 'BAR';
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

/**
 * Genera la clave AES derivada del hostname y userAgent del navegador.
 * Retorna un fallback estático en entornos sin window (SSR/test).
 */
function getEncryptionKey() {
  if (typeof window === 'undefined') {
    return 'menu-bites-fallback-key';
  }

  const dynamicPart = `${window.location.hostname}:${navigator.userAgent}`;
  return `${process.env.NEXT_PUBLIC_AUTH_CACHE_KEY || 'menu-bites-auth'}:${dynamicPart}`;
}

/**
 * Adaptador de almacenamiento AES para el middleware persist de Zustand.
 * En caso de error de descifrado (token corrupto o clave distinta) elimina la entrada
 * y retorna null para forzar un nuevo inicio de sesión.
 */
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
