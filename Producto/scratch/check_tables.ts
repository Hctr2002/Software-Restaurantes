import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const restaurantId = "59e6711e-c378-4c37-8456-792075a64ea9"; // mari-sopa
  console.log(`Checking tables for Marisopa (${restaurantId})...`);
  const { data, error } = await supabase.from("tables").select("*").eq("restaurant_id", restaurantId);
  if (error) {
    console.error("Error fetching tables:", error);
    return;
  }
  console.log("Tables found:", data.length);
  data.forEach((t) => {
    console.log(`- Table #${t.number} (ID: ${t.id}, Status: ${t.status})`);
  });
}

checkTables();
