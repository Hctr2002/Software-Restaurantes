// Acciones reutilizables contra la API del customer-portal y métricas custom.
// Cada función ejecuta una request real, valida la respuesta con check() y
// alimenta las métricas Trend/Rate para el reporte final.

import http, { RefinedResponse, ResponseType } from 'k6/http';
import { check } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import { BASE_URL, HEADERS } from './config.ts';
import {
  RESTAURANT_ID,
  TABLE_COUNT,
  KITCHEN_ITEMS,
  BAR_ITEMS,
  tableId,
  kitchenItemId,
  barItemId,
  kitchenPrice,
  barPrice,
} from './seed-data.ts';

// Métricas custom para aislar la latencia por tipo de operación.
export const orderCreation = new Trend('order_creation', true);
export const orderList = new Trend('order_list', true);
export const ordersCreated = new Counter('orders_created');

interface OrderItem {
  menu_item_id: string;
  quantity: number;
  unit_price: number;
}

interface OrderPayload {
  restaurant_id: string;
  table_id: string;
  total_amount: number;
  items: OrderItem[];
}

type Resp = RefinedResponse<ResponseType | undefined>;

const rnd = (max: number): number => Math.floor(Math.random() * max) + 1; // 1..max

/**
 * Construye un carrito aleatorio con mezcla de ítems de cocina y barra.
 * Agrega por menu_item_id (igual que un carrito real): la ruta valida que el
 * nº de ítems coincida con las filas encontradas, así que NO puede haber ids
 * duplicados en el payload.
 */
export function buildOrderPayload(): { tableNum: number; body: OrderPayload } {
  const tableNum = rnd(TABLE_COUNT);
  const byId = new Map<string, OrderItem>();

  const addItem = (id: string, price: number): void => {
    const existing = byId.get(id);
    if (existing) {
      existing.quantity += 1; // mismo ítem → sube la cantidad, no se duplica la línea
    } else {
      byId.set(id, { menu_item_id: id, quantity: 1, unit_price: price });
    }
  };

  // 1..3 selecciones de cocina (pueden colapsar en menos líneas al deduplicar)
  const nKitchen = rnd(3);
  for (let i = 0; i < nKitchen; i++) {
    const k = rnd(KITCHEN_ITEMS);
    addItem(kitchenItemId(k), kitchenPrice(k));
  }
  // 0..2 selecciones de barra
  const nBar = Math.floor(Math.random() * 3);
  for (let i = 0; i < nBar; i++) {
    const b = rnd(BAR_ITEMS);
    addItem(barItemId(b), barPrice(b));
  }

  const items = [...byId.values()];
  const total = items.reduce((sum, it) => sum + it.unit_price * it.quantity, 0);

  return {
    tableNum,
    body: { restaurant_id: RESTAURANT_ID, table_id: tableId(tableNum), total_amount: total, items },
  };
}

/** POST /api/orders — crea un pedido (camino más pesado: ~5 queries + trigger). */
export function createOrder(): { res: Resp; tableNum: number } {
  const { tableNum, body } = buildOrderPayload();
  const res = http.post(`${BASE_URL}/api/orders`, JSON.stringify(body), {
    headers: HEADERS,
    tags: { name: 'POST /api/orders' },
  });
  orderCreation.add(res.timings.duration);
  const ok = check(res, {
    'order: status 201': (r) => r.status === 201,
    'order: devuelve id': (r) => {
      try {
        return !!r.json('id');
      } catch (_e) {
        return false;
      }
    },
  });
  if (ok) ordersCreated.add(1);
  return { res, tableNum };
}

/** GET /api/orders?table_id= — lista pedidos activos de una mesa (polling del cliente). */
export function listOrders(tableNum: number): Resp {
  const res = http.get(`${BASE_URL}/api/orders?table_id=${tableId(tableNum)}`, {
    tags: { name: 'GET /api/orders' },
  });
  orderList.add(res.timings.duration);
  check(res, { 'list: status 200': (r) => r.status === 200 });
  return res;
}

/** POST /api/bill-request — solicita la cuenta (update mesa + alerta). */
export function requestBill(tableNum: number): Resp {
  const res = http.post(
    `${BASE_URL}/api/bill-request`,
    JSON.stringify({ table_id: tableId(tableNum), restaurant_id: RESTAURANT_ID, table_number: tableNum }),
    { headers: HEADERS, tags: { name: 'POST /api/bill-request' } }
  );
  check(res, { 'bill: status 200': (r) => r.status === 200 });
  return res;
}

/** POST /api/help-request — solicita ayuda (update flag en mesa). */
export function requestHelp(tableNum: number): Resp {
  const res = http.post(
    `${BASE_URL}/api/help-request`,
    JSON.stringify({ table_id: tableId(tableNum), restaurant_id: RESTAURANT_ID, table_number: tableNum }),
    { headers: HEADERS, tags: { name: 'POST /api/help-request' } }
  );
  check(res, { 'help: status 200': (r) => r.status === 200 });
  return res;
}

/**
 * Recorrido típico de un cliente: crea un pedido, consulta el estado un par
 * de veces (polling) y a veces pide la cuenta. Es la unidad de trabajo de
 * los escenarios de carga/soak/escalabilidad.
 */
export function customerJourney(): void {
  const { tableNum } = createOrder();
  listOrders(tableNum);
  if (Math.random() < 0.3) requestHelp(tableNum);
  listOrders(tableNum);
  if (Math.random() < 0.2) requestBill(tableNum);
}
