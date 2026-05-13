import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Utility to get the correct API URL for local development and production.
 * In development, it attempts to find the host IP to allow physical devices to connect.
 */
export const getApiUrl = (port: number = 3000, customEnvUrl?: string) => {
  // Si la variable remota/producción está definida y no es un localhost genérico, usarla con prioridad absoluta
  if (customEnvUrl && !customEnvUrl.includes('localhost') && !customEnvUrl.includes('127.0.0.1')) {
    return customEnvUrl;
  }

  const isDev = __DEV__;
  
  if (isDev) {
    let hostIp = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    
    // Si la variable local provee una IP externa/LAN específica, usarla
    if (customEnvUrl && customEnvUrl.includes('http://')) {
      const parts = customEnvUrl.split('://')[1]?.split(':')[0];
      if (parts && parts !== 'localhost' && parts !== '127.0.0.1') {
        hostIp = parts;
      }
    }

    try {
      const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || '';
      if (debuggerHost) {
        const parsedIp = debuggerHost.split(':')[0];
        if (parsedIp !== 'localhost' && parsedIp !== '127.0.0.1') {
          hostIp = parsedIp;
        }
      }
    } catch (e) {
      console.warn("Error detecting host IP, falling back to default local IP", e);
    }
    
    const url = `http://${hostIp}:${port}`;
    console.log(`[API Discovery] Using URL for port ${port}: ${url}`);
    return url;
  }

  // En Producción
  return customEnvUrl || process.env.EXPO_PUBLIC_API_URL || 'https://api.menubites.com';
};

/**
 * Predefined API endpoints for the Super Admin (Frontend dashboard)
 */
export const SUPERADMIN_API = getApiUrl(3000, process.env.EXPO_PUBLIC_SUPERADMIN_API_URL);

/**
 * Predefined API endpoints for the Local Admin (Local dashboard)
 */
export const LOCALADMIN_API = getApiUrl(3003, process.env.EXPO_PUBLIC_LOCALADMIN_API_URL);

/**
 * URL for the Customer Portal (for QR generation)
 */
export const CUSTOMER_PORTAL_URL = getApiUrl(3005, process.env.EXPO_PUBLIC_CUSTOMER_PORTAL_URL);

