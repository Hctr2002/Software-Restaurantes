import { createServiceClient } from "../localApi";
import { ThemeInput } from "../schemas/themeSchema";

export const themeService = {
  async getByRestaurant(restaurantId: string) {
    const db = createServiceClient();
    return await db
      .from("restaurant_themes")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });
  },

  async getActive(restaurantId: string) {
    const db = createServiceClient();
    return await db
      .from("restaurant_themes")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true)
      .single();
  },

  async save(restaurantId: string, data: ThemeInput) {
    const db = createServiceClient();
    
    // Si el tema que estamos guardando es activo, el trigger se encargará de desactivar los otros
    return await db
      .from("restaurant_themes")
      .insert({
        name: data.name,
        palette_name: data.paletteName || null,
        is_custom: data.isCustom,
        is_active: data.isActive,
        primary_color: data.primaryColor,
        secondary_color: data.secondaryColor,
        background_color: data.backgroundColor,
        accent_color: data.accentColor,
        text_color: data.textColor,
        card_background: data.cardBackground,
        font_title: data.fontTitle,
        font_body: data.fontBody,
        font_accent: data.fontAccent,
        logo_url: data.logoUrl || null,
        restaurant_id: restaurantId,
      })
      .select()
      .single();
  },

  async activate(restaurantId: string, themeId: string) {
    const db = createServiceClient();
    
    // Desactivar todos primero
    await db
      .from("restaurant_themes")
      .update({ is_active: false })
      .eq("restaurant_id", restaurantId);

    // Activar el seleccionado
    return await db
      .from("restaurant_themes")
      .update({ is_active: true })
      .eq("id", themeId)
      .eq("restaurant_id", restaurantId)
      .select()
      .single();
  },

  async delete(restaurantId: string, themeId: string) {
    const db = createServiceClient();
    return await db
      .from("restaurant_themes")
      .delete()
      .eq("id", themeId)
      .eq("restaurant_id", restaurantId);
  }
};
