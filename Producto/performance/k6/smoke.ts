// SMOKE — verificación mínima de que los endpoints responden correctamente.
// 1 usuario virtual, baja carga. Si esto falla, no tiene sentido medir nada más.
//
//   k6 run performance/k6/smoke.ts
//   LOAD_BASE_URL=http://localhost:3005 k6 run performance/k6/smoke.ts

import { sleep } from 'k6';
import { Options } from 'k6/options';
import { createOrder, listOrders, requestHelp, requestBill } from './lib/workload.ts';

export const options: Options = {
  vus: 1,
  iterations: 10,
  thresholds: {
    http_req_failed: ['rate==0'], // en smoke no se tolera ningún error
    http_req_duration: ['p(95)<1500'],
  },
};

export default function (): void {
  const { tableNum } = createOrder();
  listOrders(tableNum);
  requestHelp(tableNum);
  requestBill(tableNum);
  sleep(0.5);
}
