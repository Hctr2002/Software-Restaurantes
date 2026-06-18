// SCALABILITY — mide CÓMO escala el sistema al subir la tasa de llegada.
// Usa el modelo "open" (ramping-arrival-rate): fija peticiones por segundo
// independientemente de cuántas respondan, y aumenta por escalones:
//   10 → 25 → 50 → 100 → 200 req/s
// Así se ve hasta qué RPS el sistema sostiene la tasa sin que la latencia
// y los errores se disparen (el punto donde deja de escalar linealmente).
//
//   k6 run performance/k6/scalability.ts
//   LOAD_FACTOR=2 k6 run performance/k6/scalability.ts   # escala los RPS objetivo
//
// Sugerencia: exporta métricas por escalón para graficar RPS vs p95:
//   k6 run --out json=performance/results/scalability.json performance/k6/scalability.ts

import { Options } from 'k6/options';
import { scale } from './lib/config.ts';
import { createOrder, listOrders } from './lib/workload.ts';

const step = (target: number, duration = '1m') => ({ target: scale(target), duration });

export const options: Options = {
  scenarios: {
    escalabilidad: {
      executor: 'ramping-arrival-rate',
      startRate: scale(5), // req/s inicial
      timeUnit: '1s',
      // Pre-asigna VUs suficientes para sostener el RPS objetivo aunque el
      // backend se ralentice; sube maxVUs si k6 avisa "insufficient VUs".
      preAllocatedVUs: scale(50),
      maxVUs: scale(500),
      stages: [
        step(10, '30s'),
        step(10),
        step(25, '30s'),
        step(25),
        step(50, '30s'),
        step(50),
        step(100, '30s'),
        step(100),
        step(200, '30s'),
        step(200),
        { target: 0, duration: '20s' },
      ],
    },
  },
  thresholds: {
    // Si se incumplen, es señal de que el sistema dejó de escalar a ese RPS.
    http_req_failed: [{ threshold: 'rate<0.02', abortOnFail: false }],
    http_req_duration: [{ threshold: 'p(95)<2000', abortOnFail: false }],
    order_creation: [{ threshold: 'p(95)<2500', abortOnFail: false }],
  },
};

// 80% creación de pedidos (escritura pesada), 20% consulta (lectura).
export default function (): void {
  if (Math.random() < 0.8) {
    createOrder();
  } else {
    listOrders(Math.floor(Math.random() * 100) + 1);
  }
}
