import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAnonMenu() {
  const restaurantId = "169f8d4d-72eb-4b7a-b062-3ddae4cdef1c"; // burger
  console.log(`Testing anon access for restaurant categories and items: ${restaurantId}...`);
  
  const { data: cats, error: catError } = await supabase
    .from("categories")
    .select("*")
    .eq("restaurant_id", restaurantId);
  
  if (catError) console.error("Cat Error:", catError.message);
  else console.log("Cats found with anon:", cats.length);

  const { data: items, error: itemError } = await supabase
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", restaurantId);
  
  if (itemError) console.error("Item Error:", itemError.message);
  else console.log("Items found with anon:", items.length);
}

testAnonMenu();
