import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBurgerRestaurant() {
  const slug = "burger";
  console.log(`Checking restaurant with slug: ${slug}...`);
  
  const { data: restaurant, error: resError } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .single();

  if (resError || !restaurant) {
    console.error("Restaurant not found:", resError?.message || "No data");
    return;
  }

  const restaurantId = restaurant.id;
  console.log(`Found restaurant: ${restaurant.name} (ID: ${restaurantId})`);

  // Check Categories
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("*")
    .eq("restaurant_id", restaurantId);
  console.log(`Categories found: ${categories?.length || 0}`);

  // Check Menu Items
  const { data: items, error: itemError } = await supabase
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", restaurantId);
  console.log(`Menu Items found: ${items?.length || 0}`);

  // Check Tables
  const { data: tables, error: tableError } = await supabase
    .from("tables")
    .select("*")
    .eq("restaurant_id", restaurantId);
  console.log(`Tables found: ${tables?.length || 0}`);
  tables?.forEach(t => console.log(`- Table #${t.number} (ID: ${t.id})`));
}

checkBurgerRestaurant();
