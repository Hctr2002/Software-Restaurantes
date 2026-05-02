import { createServiceClient } from "../localApi";
import { MenuInput } from "../schemas/menuSchema";

export const menuService = {
  async getByRestaurant(restaurantId: string) {
    const db = createServiceClient();
    return await db
      .from("menu_items")
      .select("id, name, description, price, categoryId:category_id, is_active, restaurant_id, categories(name)")
      .eq("restaurant_id", restaurantId)
      .order("name");
  },

  async create(restaurantId: string, data: MenuInput) {
    const db = createServiceClient();
    return await db
      .from("menu_items")
      .insert({
        ...data,
        description: data.description ?? null,
        restaurant_id: restaurantId,
      })
      .select()
      .single();
  },

  async update(restaurantId: string, id: string, data: MenuInput) {
    const db = createServiceClient();
    return await db
      .from("menu_items")
      .update({
        ...data,
        description: data.description ?? null,
      })
      .eq("id", id)
      .eq("restaurant_id", restaurantId)
      .select()
      .single();
  },

  async delete(restaurantId: string, id: string) {
    const db = createServiceClient();
    return await db
      .from("menu_items")
      .delete()
      .eq("id", id)
      .eq("restaurant_id", restaurantId);
  }
};
