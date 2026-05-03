import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBurgerActive() {
  const restaurantId = "169f8d4d-72eb-4b7a-b062-3ddae4cdef1c";
  
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, is_active")
    .eq("restaurant_id", restaurantId);
  console.log("Categories:", categories);

  const { data: items } = await supabase
    .from("menu_items")
    .select("id, name, is_active")
    .eq("restaurant_id", restaurantId);
  console.log("Menu Items:", items);
}

checkBurgerActive();
