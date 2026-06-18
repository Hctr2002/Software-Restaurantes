// STRESS — empuja MÁS ALLÁ de la capacidad esperada para encontrar el punto
// de quiebre. Sube por escalones (50→100→200→300 VUs) concentrando la carga
// en el endpoint más pesado (creación de pedidos).
// Observa en qué escalón se disparan latencia y errores.
//
//   k6 run performance/k6/stress.ts
//   LOAD_FACTOR=0.5 k6 run performance/k6/stress.ts   # reduce si la máquina es modesta

import { sleep } from 'k6';
import { Options } from 'k6/options';
import { scale } from './lib/config.ts';
import { createOrder } from './lib/workload.ts';

export const options: Options = {
  scenarios: {
    estres_escalonado: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: scale(50) },
        { duration: '1m', target: scale(50) },
        { duration: '30s', target: scale(100) },
        { duration: '1m', target: scale(100) },
        { duration: '30s', target: scale(200) },
        { duration: '1m', target: scale(200) },
        { duration: '30s', target: scale(300) },
        { duration: '1m', target: scale(300) },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '20s',
    },
  },
  // Umbrales relajados: el objetivo es ENCONTRAR el límite, no aprobar/reprobar.
  // Marca el quiebre cuando se superan estos valores degradados.
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.05', abortOnFail: false }],
    http_req_duration: [{ threshold: 'p(95)<3000', abortOnFail: false }],
  },
};

export default function (): void {
  createOrder();
  sleep(0.3);
}
