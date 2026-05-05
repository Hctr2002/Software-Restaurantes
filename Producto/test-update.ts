require('dotenv').config();
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const STATUS_TIMESTAMP = {
  VALIDATED:  "validated_at",
  PREPARING:  "preparing_at",
  READY:      "ready_at",
};

async function test() {
  const { data: orders } = await supabase.from("orders").select("id").eq("status", "PENDING").limit(1);
  if (!orders || orders.length === 0) {
    console.log("No pending orders");
    return;
  }
  const orderId = orders[0].id;
  console.log("Validating order:", orderId);
  const status = "VALIDATED";
  const timestampField = STATUS_TIMESTAMP[status];
  const payload = { status };
  if (timestampField) payload[timestampField] = new Date().toISOString();

  const { data, error } = await supabase
    .from("orders")
    .update(payload)
    .eq("id", orderId)
    .select();
  console.log("Error:", error);
  console.log("Data:", data);
}
test();
