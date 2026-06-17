// SOAK — carga moderada SOSTENIDA durante un periodo largo.
// Busca degradaciones que solo aparecen con el tiempo: fugas de memoria,
// agotamiento del pool de conexiones, crecimiento de latencia, leaks de la BD.
//
// Por defecto dura ~16min; ajustable con SOAK_DURATION.
//   SOAK_DURATION=2h k6 run performance/k6/soak.ts

import { sleep } from 'k6';
import { Options } from 'k6/options';
import { DEFAULT_THRESHOLDS, scale } from './lib/config.ts';
import { customerJourney } from './lib/workload.ts';

const DURATION: string = __ENV.SOAK_DURATION || '15m';

export const options: Options = {
  scenarios: {
    soak: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: scale(20) }, // subida
        { duration: DURATION, target: scale(20) }, // meseta sostenida
        { duration: '30s', target: 0 }, // bajada
      ],
      gracefulRampDown: '15s',
    },
  },
  thresholds: DEFAULT_THRESHOLDS,
};

export default function (): void {
  customerJourney();
  sleep(Math.random() * 2 + 1);
}
