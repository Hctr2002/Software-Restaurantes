import type { OrderStatus } from "@menu-bites/ui";

interface MockOrderItem {
  id: string;
  quantity: number;
  menu_item: { name: string };
}

export interface MockOrder {
  id: string;
  status: OrderStatus;
  createdAt: string;
  table: { number: number };
  items: MockOrderItem[];
}

const now = Date.now();
const mins = (m: number) => new Date(now - m * 60 * 1000).toISOString();

export const MOCK_ORDERS: MockOrder[] = [
  {
    id: "mock-order-001",
    status: "VALIDATED",
    createdAt: mins(2),
    table: { number: 3 },
    items: [
      { id: "i1", quantity: 2, menu_item: { name: "Lomo a lo Pobre" } },
      { id: "i2", quantity: 1, menu_item: { name: "Pisco Sour" } },
    ],
  },
  {
    id: "mock-order-002",
    status: "VALIDATED",
    createdAt: mins(5),
    table: { number: 7 },
    items: [
      { id: "i3", quantity: 1, menu_item: { name: "Cazuela de Vacuno" } },
      { id: "i4", quantity: 3, menu_item: { name: "Empanada de Pino" } },
      { id: "i5", quantity: 2, menu_item: { name: "Agua Mineral" } },
    ],
  },
  {
    id: "mock-order-003",
    status: "PREPARING",
    createdAt: mins(8),
    table: { number: 2 },
    items: [
      { id: "i6", quantity: 2, menu_item: { name: "Pastel de Choclo" } },
      { id: "i7", quantity: 1, menu_item: { name: "Ensalada Chilena" } },
    ],
  },
  {
    // Este pedido supera los 15 min — activa la alerta de retraso (brand-accent pulsante)
    id: "mock-order-004",
    status: "PREPARING",
    createdAt: mins(18),
    table: { number: 5 },
    items: [
      { id: "i8", quantity: 1, menu_item: { name: "Reineta a la Plancha" } },
      { id: "i9", quantity: 1, menu_item: { name: "Papas Fritas" } },
      { id: "i10", quantity: 2, menu_item: { name: "Jugo de Naranja" } },
    ],
  },
  {
    id: "mock-order-005",
    status: "READY",
    createdAt: mins(22),
    table: { number: 1 },
    items: [
      { id: "i11", quantity: 4, menu_item: { name: "Sopaipillas" } },
      { id: "i12", quantity: 2, menu_item: { name: "Terremotos" } },
    ],
  },
];
