export type Restaurant = {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  plan_id?: string | null;
  plans?: { name: string } | null;
};

export type UserRecord = {
  id: string;
  email: string;
  role: string;
  restaurant_id: string | null;
  createdAt: string;
  restaurants?: { name: string } | { name: string }[] | null;
};

export const ROLES = ["SUPER_ADMIN", "ADMIN", "GARZON", "COCINA", "CAJERO", "CLIENTE", "BAR"];
export const RESTAURANT_STATUSES = ["ACTIVE", "SUSPENDED", "CANCELLED"];

export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha invalida";
  return date.toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
