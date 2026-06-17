// Configuración común a todos los escenarios de k6.
// Casi todo es ajustable por variable de entorno para no tocar el código.

import { Threshold } from 'k6/options';

// URL base de la app bajo prueba (customer-portal por defecto).
export const BASE_URL: string = __ENV.LOAD_BASE_URL || 'http://localhost:3005';

// Umbrales por defecto. Las pruebas de estrés/spike los relajan.
// p95 y p99 en milisegundos; tasa de error como fracción (0.01 = 1%).
export const DEFAULT_THRESHOLDS: Record<string, Threshold[]> = {
  http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: false }],
  http_req_duration: ['p(95)<800', 'p(99)<1500'],
  // Latencia específica de la creación de pedidos (el camino más pesado).
  order_creation: ['p(95)<1200'],
};

export const HEADERS = { 'Content-Type': 'application/json' };

// Permite escalar la carga de cualquier escenario con un multiplicador global,
// p. ej. LOAD_FACTOR=2 k6 run load.ts  → duplica los VUs/tasa de cada etapa.
export const LOAD_FACTOR: number = Number(__ENV.LOAD_FACTOR || 1);

export const scale = (n: number): number => Math.max(1, Math.round(n * LOAD_FACTOR));
