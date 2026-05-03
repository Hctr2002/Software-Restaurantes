import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkItemCategory() {
  const { data: item } = await supabase
    .from("menu_items")
    .select("name, category_id")
    .eq("id", "ba9b7ade-8940-4523-a28f-c501f1365878")
    .single();
  console.log("Item:", item);
}

checkItemCategory();
