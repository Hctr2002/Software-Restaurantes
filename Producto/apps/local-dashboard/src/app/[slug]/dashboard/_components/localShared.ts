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
  LocalUserRecord 
} from "@menu-bites/auth";

export const ORDER_STATUSES = ["PENDING", "VALIDATED", "PREPARING", "READY", "DELIVERED", "REJECTED"];
export const LOCAL_ROLES = ["ADMIN", "COCINA", "CAJERO", "GARZON"];
