-- 0002_public_read_customer_portal.sql
-- Políticas de lectura pública para customer-portal.
--
-- Contexto: customer-portal accede a Supabase con el cliente anon (sin JWT de sesión
-- de staff). Las políticas de aislamiento tenant de 0001 usan get_auth_restaurant_id()
-- que retorna NULL para usuarios anónimos, bloqueando todas sus queries.
-- Estas políticas cubren únicamente SELECT sobre datos inherentemente públicos.

-- restaurants: lookup por slug en getRestaurantBySlug()
DROP POLICY IF EXISTS public_read_restaurants ON restaurants;
CREATE POLICY public_read_restaurants ON restaurants
  FOR SELECT TO anon
  USING (status = 'ACTIVE');

-- categories: getCategoriesByRestaurant()
DROP POLICY IF EXISTS public_read_categories ON categories;
CREATE POLICY public_read_categories ON categories
  FOR SELECT TO anon
  USING (is_active = true);

-- menu_items: getMenuItemsByRestaurant()
DROP POLICY IF EXISTS public_read_menu_items ON menu_items;
CREATE POLICY public_read_menu_items ON menu_items
  FOR SELECT TO anon
  USING (is_active = true);

-- tables: getTableByNumber() / getTablesByRestaurant() — validación QR en checkout
DROP POLICY IF EXISTS public_read_tables ON tables;
CREATE POLICY public_read_tables ON tables
  FOR SELECT TO anon
  USING (true);

-- restaurant_themes: getThemeByRestaurant() — branding dinámico
DROP POLICY IF EXISTS public_read_restaurant_themes ON restaurant_themes;
CREATE POLICY public_read_restaurant_themes ON restaurant_themes
  FOR SELECT TO anon
  USING (is_active = true);
