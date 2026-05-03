import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAnonAccess() {
  const slug = "burger";
  console.log(`Testing anon access for restaurant slug: ${slug}...`);
  
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, status")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error with anon key:", error.message);
  } else {
    console.log("Success with anon key:", data);
  }
}

testAnonAccess();
