import Constants from 'expo-constants';

/**
 * Utility to get the correct API URL for local development and production.
 * In development, it attempts to find the host IP to allow physical devices to connect.
 */
export const getApiUrl = (port: number = 3000) => {
  const isDev = __DEV__;
  
  if (isDev) {
    let hostIp = 'localhost';
    
    try {
      const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || '';
      if (debuggerHost) {
        hostIp = debuggerHost.split(':')[0];
      }
    } catch (e) {
      console.warn("Error detecting host IP, falling back to localhost", e);
    }
    
    const url = `http://${hostIp}:${port}`;
    console.log(`[API Discovery] Using URL for port ${port}: ${url}`);
    return url;
  }

  return process.env.EXPO_PUBLIC_API_URL || 'https://api.menubites.com';
};

/**
 * Predefined API endpoints for the Super Admin (Frontend dashboard)
 */
export const SUPERADMIN_API = getApiUrl(3000) || process.env.EXPO_PUBLIC_SUPERADMIN_API_URL;

/**
 * Predefined API endpoints for the Local Admin (Local dashboard)
 */
export const LOCALADMIN_API = getApiUrl(3003) || process.env.EXPO_PUBLIC_LOCALADMIN_API_URL;

