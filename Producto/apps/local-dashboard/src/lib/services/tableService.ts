import { createServiceClient } from "../localApi";
import { TableInput } from "../schemas/tableSchema";

export const tableService = {
  async getByRestaurant(restaurantId: string) {
    const db = createServiceClient();
    return await db
      .from("tables")
      .select("id, number, label, status, qrData:qr_data, restaurant_id")
      .eq("restaurant_id", restaurantId)
      .order("number");
  },

  async create(restaurantId: string, data: TableInput, origin: string) {
    const db = createServiceClient();
    const qr_data = `${origin}/order/${restaurantId}/${data.number}`;

    return await db
      .from("tables")
      .insert({
        ...data,
        label: data.label ?? null,
        restaurant_id: restaurantId,
        qr_data,
      })
      .select("id, number, label, status, qrData:qr_data, restaurant_id")
      .single();
  },

  async update(restaurantId: string, id: string, data: TableInput) {
    const db = createServiceClient();
    // Note: We typically don't update qr_data unless the number or restaurant changes,
    // which is not supported in the basic update for stability.
    return await db
      .from("tables")
      .update({
        ...data,
        label: data.label ?? null,
      })
      .eq("id", id)
      .eq("restaurant_id", restaurantId)
      .select("id, number, label, status, qrData:qr_data, restaurant_id")
      .single();
  },

  async delete(restaurantId: string, id: string) {
    const db = createServiceClient();
    return await db
      .from("tables")
      .delete()
      .eq("id", id)
      .eq("restaurant_id", restaurantId);
  }
};
