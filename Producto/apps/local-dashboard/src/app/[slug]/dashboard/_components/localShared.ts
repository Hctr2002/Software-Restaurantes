/**
 * localShared.ts — Re-exportaciones y constantes compartidas dentro del dashboard local.
 * Centraliza tipos, formateadores y constantes de dominio para evitar importaciones dispersas.
 */
import {
  formatDateTime as formatDate,
  formatCLP as formatPrice, 
  timeAgo 
} from "@menu-bites/auth";

export { formatDate, formatPrice, timeAgo };

export type { 
  Alert, 
  AlertType, 
  Order, 
  OrderItem, 
  Category, 
  MenuItem, 
  Inventory, 
  LocalUserRecord,
  OrderStatus
} from "@menu-bites/auth";

export const ORDER_STATUSES = ["PENDING", "VALIDATED", "PREPARING", "READY", "DELIVERED", "COMPLETED", "REJECTED"];
export const LOCAL_ROLES = ["ADMIN", "COCINA", "CAJERO", "GARZON", "BAR"];
