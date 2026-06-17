// SPIKE — ráfaga repentina sobre una base tranquila y vuelta a la calma.
// Simula un golpe de tráfico (p. ej. todas las mesas pidiendo a la vez).
// Mide si el sistema absorbe el pico y, sobre todo, si SE RECUPERA después.
//
//   k6 run performance/k6/spike.ts

import { sleep } from 'k6';
import { Options } from 'k6/options';
import { scale } from './lib/config.ts';
import { customerJourney } from './lib/workload.ts';

export const options: Options = {
  scenarios: {
    rafaga: {
      executor: 'ramping-vus',
      startVUs: scale(5),
      stages: [
        { duration: '20s', target: scale(5) }, // base tranquila
        { duration: '10s', target: scale(250) }, // ⚡ pico súbito
        { duration: '40s', target: scale(250) }, // se mantiene el pico
        { duration: '10s', target: scale(5) }, // caída brusca
        { duration: '40s', target: scale(5) }, // ¿se recupera la latencia?
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '15s',
    },
  },
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.10', abortOnFail: false }],
    http_req_duration: [{ threshold: 'p(95)<5000', abortOnFail: false }],
  },
};

export default function (): void {
  customerJourney();
  sleep(1);
}
