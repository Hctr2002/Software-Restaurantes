import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRestaurants() {
  console.log("Checking restaurants in database...");
  const { data, error } = await supabase.from("restaurants").select("*");
  if (error) {
    console.error("Error fetching restaurants:", error);
    return;
  }
  console.log("Restaurants found:", data.length);
  data.forEach((r) => {
    console.log(`- [${r.id}] ${r.name} (Slug: ${r.slug}, Status: ${r.status})`);
  });
}

checkRestaurants();
