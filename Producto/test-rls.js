require('dotenv').config();
const { createClient } = require("@supabase/supabase-js");

async function test() {
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabaseAdmin.rpc('get_policies');
  if (error) {
    // try to query pg_policies
    const { data: policies, error: pError } = await supabaseAdmin.from('pg_policies').select('*');
    if (pError) {
      console.log("Could not query pg_policies via REST either:", pError.message);
    } else {
      console.log(policies);
    }
  } else {
    console.log(data);
  }
}
test();
