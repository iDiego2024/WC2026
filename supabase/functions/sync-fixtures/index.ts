import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.107.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();
  let status = "success";
  let recordsUpdated = 0;
  let apiCalls = 0;
  let errorMessage = "";

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("VITE_SUPABASE_ANON_KEY") || "";
  const apiKey = Deno.env.get("RAPIDAPI_KEY") || "";

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    if (!apiKey) {
      throw new Error("RAPIDAPI_KEY environment variable is not defined.");
    }

    // Determine request headers and URL based on key type
    const isDirectKey = apiKey.length === 64;
    const url = isDirectKey
      ? "https://v3.football.api-sports.io/fixtures?league=1&season=2026"
      : "https://api-football-v1.p.rapidapi.com/v3/fixtures?league=1&season=2026";
    
    const headers: Record<string, string> = isDirectKey
      ? { "x-apisports-key": apiKey }
      : {
          "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
          "x-rapidapi-key": apiKey
        };

    console.log(`Fetching fixtures from: ${url}`);
    apiCalls++;
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`API returned HTTP error status: ${response.status}`);
    }

    const data = await response.json();
    const fixtures = data?.response || [];
    console.log(`Fetched ${fixtures.length} fixtures from API.`);

    if (fixtures.length === 0) {
      throw new Error("No fixtures returned by the API.");
    }

    // 1. Groups insert/upsert
    const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    for (const g of groups) {
      await supabase.from('groups').upsert({ id: g, name: `Grupo ${g}` });
    }

    // 2. Process and map Stadiums & Teams
    const stadiumsMap: Record<string, string> = {};
    const teamsMap: Record<string, string> = {};

    for (const item of fixtures) {
      const apiStadium = item.fixture.venue;
      if (apiStadium && apiStadium.name) {
        const { data: stdData } = await supabase
          .from("stadiums")
          .upsert({
            name: apiStadium.name,
            city: apiStadium.city || "TBD",
            capacity: apiStadium.capacity || null,
            api_id: apiStadium.id || null
          }, { onConflict: "name" })
          .select("id, name")
          .single();
        if (stdData) {
          stadiumsMap[stdData.name] = stdData.id;
        }
      }

      // Home team mapping
      const home = item.teams.home;
      if (home && home.name) {
        const { data: teamData } = await supabase
          .from("teams")
          .upsert({
            name: home.name,
            code: home.name.substring(0, 3).toUpperCase(), // fallback
            flag_code: home.logo || "",
            api_id: home.id
          }, { onConflict: "api_id" })
          .select("id, api_id")
          .single();
        if (teamData) {
          teamsMap[String(teamData.api_id)] = teamData.id;
        }
      }

      // Away team mapping
      const away = item.teams.away;
      if (away && away.name) {
        const { data: teamData } = await supabase
          .from("teams")
          .upsert({
            name: away.name,
            code: away.name.substring(0, 3).toUpperCase(),
            flag_code: away.logo || "",
            api_id: away.id
          }, { onConflict: "api_id" })
          .select("id, api_id")
          .single();
        if (teamData) {
          teamsMap[String(teamData.api_id)] = teamData.id;
        }
      }
    }

    // 3. Process Matches
    const matchesToUpsert = [];
    for (const item of fixtures) {
      const apiMatchId = item.fixture.id;
      const dbHomeId = teamsMap[String(item.teams.home.id)] || null;
      const dbAwayId = teamsMap[String(item.teams.away.id)] || null;
      const stadiumName = item.fixture.venue?.name || "";
      const dbStadiumId = stadiumsMap[stadiumName] || null;

      const dateStr = item.fixture.date;
      const statusStr = item.fixture.status.short === "FT" ? "finished" : 
                        ["1H", "2H", "HT", "ET", "P"].includes(item.fixture.status.short) ? "live" : "scheduled";

      matchesToUpsert.push({
        home_team_id: dbHomeId,
        away_team_id: dbAwayId,
        stadium_id: dbStadiumId,
        date: dateStr,
        stage: item.league.round.includes("Group") ? "Group Stage" : "Round of 32", // fallback matching round
        status: statusStr,
        home_score: item.goals.home,
        away_score: item.goals.away,
        api_id: apiMatchId
      });
    }

    const { error: matchesError } = await supabase
      .from("matches")
      .upsert(matchesToUpsert, { onConflict: "api_id" });

    if (matchesError) throw matchesError;

    recordsUpdated = matchesToUpsert.length;

  } catch (err: any) {
    status = "error";
    errorMessage = err.message || String(err);
    console.error("Error in sync-fixtures:", errorMessage);
  } finally {
    // Log execution
    const executionTime = Date.now() - startTime;
    await supabase.from("sync_logs").insert({
      function_name: "sync-fixtures",
      status,
      records_updated: recordsUpdated,
      api_calls_count: apiCalls,
      execution_time_ms: executionTime,
      error_message: errorMessage || null
    });
  }

  return new Response(
    JSON.stringify({ status, recordsUpdated, executionTimeMs: Date.now() - startTime, error: errorMessage || null }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: status === "success" ? 200 : 500,
    }
  );
});
