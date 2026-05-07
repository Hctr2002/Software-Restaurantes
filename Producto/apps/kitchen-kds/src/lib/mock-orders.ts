import type { OrderStatus } from "@menu-bites/ui";

interface MockOrderItem {
  id: string;
  quantity: number;
  menuItem: { name: string };
}

export interface MockOrder {
  id: string;
  status: OrderStatus;
  createdAt: string;
  table: { number: number };
  orderItems: MockOrderItem[];
}

const now = Date.now();
const mins = (m: number) => new Date(now - m * 60 * 1000).toISOString();

export const MOCK_ORDERS: MockOrder[] = [
  {
    id: "mock-order-001",
    status: "VALIDATED",
    createdAt: mins(2),
    table: { number: 3 },
    orderItems: [
      { id: "i1", quantity: 2, menuItem: { name: "Lomo a lo Pobre" } },
      { id: "i2", quantity: 1, menuItem: { name: "Pisco Sour" } },
    ],
  },
  {
    id: "mock-order-002",
    status: "VALIDATED",
    createdAt: mins(5),
    table: { number: 7 },
    orderItems: [
      { id: "i3", quantity: 1, menuItem: { name: "Cazuela de Vacuno" } },
      { id: "i4", quantity: 3, menuItem: { name: "Empanada de Pino" } },
      { id: "i5", quantity: 2, menuItem: { name: "Agua Mineral" } },
    ],
  },
  {
    id: "mock-order-003",
    status: "PREPARING",
    createdAt: mins(8),
    table: { number: 2 },
    orderItems: [
      { id: "i6", quantity: 2, menuItem: { name: "Pastel de Choclo" } },
      { id: "i7", quantity: 1, menuItem: { name: "Ensalada Chilena" } },
    ],
  },
  {
    id: "mock-order-004",
    status: "PREPARING",
    createdAt: mins(18),
    table: { number: 5 },
    orderItems: [
      { id: "i8", quantity: 1, menuItem: { name: "Reineta a la Plancha" } },
      { id: "i9", quantity: 1, menuItem: { name: "Papas Fritas" } },
      { id: "i10", quantity: 2, menuItem: { name: "Jugo de Naranja" } },
    ],
  },
  {
    id: "mock-order-005",
    status: "READY",
    createdAt: mins(22),
    table: { number: 1 },
    orderItems: [
      { id: "i11", quantity: 4, menuItem: { name: "Sopaipillas" } },
      { id: "i12", quantity: 2, menuItem: { name: "Terremotos" } },
    ],
  },
];
