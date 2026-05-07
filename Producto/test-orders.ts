require('dotenv').config();
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase
      .from("orders")
      .select("id, status, table_id, total_amount, createdAt, created_at")
      .in("status", ["PENDING", "READY"])
      .order("created_at", { ascending: true })
      .limit(5);
  console.log("Error Waiter Select:", error);
  console.log("Data Waiter:", JSON.stringify(data, null, 2));

  const localRes = await supabase
    .from("orders")
    .select("id, status, createdAt, table_id, session_id")
    .in("status", ["PENDING", "READY"])
    .order("createdAt", { ascending: false })
    .limit(5);
  console.log("Error Local Select:", localRes.error);
  console.log("Data Local:", JSON.stringify(localRes.data, null, 2));
}
test();
