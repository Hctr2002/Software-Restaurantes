// LOAD — carga esperada en operación normal (hora de servicio de un local).
// Sube gradualmente a ~30 clientes concurrentes, se mantiene y baja.
// Mide si el sistema cumple SLO de latencia y error bajo carga realista.
//
//   k6 run performance/k6/load.ts
//   LOAD_FACTOR=2 k6 run performance/k6/load.ts   # duplica la carga
//   K6_WEB_DASHBOARD=true k6 run performance/k6/load.ts

import { sleep } from 'k6';
import { Options } from 'k6/options';
import { DEFAULT_THRESHOLDS, scale } from './lib/config.ts';
import { customerJourney } from './lib/workload.ts';

export const options: Options = {
  scenarios: {
    carga_normal: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: scale(15) }, // rampa de subida
        { duration: '1m', target: scale(30) }, // pico de servicio
        { duration: '2m', target: scale(30) }, // sostenido
        { duration: '30s', target: 0 }, // bajada
      ],
      gracefulRampDown: '15s',
    },
  },
  thresholds: DEFAULT_THRESHOLDS,
};

export default function (): void {
  customerJourney();
  sleep(Math.random() * 2 + 1); // think-time 1-3s entre acciones del cliente
}
