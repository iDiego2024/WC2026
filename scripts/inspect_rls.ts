import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

async function inspect() {
  const { data, error } = await supabase.rpc('get_policies'); // or just execute raw sql via dynamic function if available, or fetch policies through pg_policies table using a custom RPC if it exists.
  // Wait, if no rpc exists, we can query pg_policies by fetching it or checking RLS on table profiles and match_predictions by executing a query.
  // Since we can query pg_policies using custom select, let's see if we can do a select on a view or table if we have service role.
  console.log("Checking RLS policies...");
  try {
    // We can query pg_catalog or information_schema through Postgrest if they are exposed? No, Postgrest only exposes public schema tables.
    // Wait, let's query a dummy insert to see what error it throws, or query pg_attribute if pg_catalog is exposed (usually not).
    // Let's try to fetch columns from matches or match_predictions by inserting a dummy object with random fields and seeing the database error.
    // Better: let's try a dummy insert with home_score and away_score:
    const { data, error } = await supabase.from('match_predictions').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      match_id: '00000000-0000-0000-0000-000000000000',
      home_score: 1,
      away_score: 2
    }).select();
    console.log("Dummy insert result:", data);
    console.log("Dummy insert error:", error);
  } catch (err: any) {
    console.error("Dummy insert catch:", err);
  }

  // Let's also check if we can insert/upsert a dummy prediction or profile using ANON key
  const anonClient = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );
  
  console.log("Anon client initialized.");
}

inspect().catch(console.error);
