import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.107.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
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
      throw new Error("RAPIDAPI_KEY is not defined.");
    }

    const isDirectKey = apiKey.length === 64;
    const baseDomain = isDirectKey ? "https://v3.football.api-sports.io" : "https://api-football-v1.p.rapidapi.com/v3";
    const headers: Record<string, string> = isDirectKey
      ? { "x-apisports-key": apiKey }
      : {
          "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
          "x-rapidapi-key": apiKey
        };

    // 1. Fetch fixtures status from API-Football
    apiCalls++;
    const res = await fetch(`${baseDomain}/fixtures?league=1&season=2026`, { headers });
    if (!res.ok) throw new Error(`API returned HTTP ${res.status}`);
    const data = await res.json();
    const fixtures = data?.response || [];

    // Filter live matches or matches that just finished to update details
    const activeMatches = fixtures.filter((f: any) => {
      const statusShort = f.fixture.status.short;
      return ["1H", "2H", "HT", "ET", "P", "FT"].includes(statusShort);
    });

    console.log(`Found ${activeMatches.length} matches to check for detail updates.`);

    for (const match of activeMatches) {
      const apiMatchId = match.fixture.id;
      const statusShort = match.fixture.status.short;
      const matchStatus = statusShort === "FT" ? "finished" : "live";
      const homeScore = match.goals.home;
      const awayScore = match.goals.away;
      const elapsedMinute = match.fixture.status.elapsed || null;

      let events = null;
      let lineups = null;
      let stats = null;

      // Only fetch detailed stats/lineups if it's currently live, to optimize API rate limits
      if (matchStatus === "live") {
        // Fetch events (goals, cards, substitutions)
        try {
          apiCalls++;
          const eventsRes = await fetch(`${baseDomain}/fixtures/events?fixture=${apiMatchId}`, { headers });
          if (eventsRes.ok) {
            const eventsData = await eventsRes.json();
            events = eventsData?.response || [];
          }
        } catch (e) {
          console.error(`Error fetching events for match ${apiMatchId}:`, e);
        }

        // Fetch lineups
        try {
          apiCalls++;
          const lineupsRes = await fetch(`${baseDomain}/fixtures/lineups?fixture=${apiMatchId}`, { headers });
          if (lineupsRes.ok) {
            const lineupsData = await lineupsRes.json();
            lineups = lineupsData?.response || [];
          }
        } catch (e) {
          console.error(`Error fetching lineups for match ${apiMatchId}:`, e);
        }

        // Fetch statistics
        try {
          apiCalls++;
          const statsRes = await fetch(`${baseDomain}/fixtures/statistics?fixture=${apiMatchId}`, { headers });
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            stats = statsData?.response || [];
          }
        } catch (e) {
          console.error(`Error fetching statistics for match ${apiMatchId}:`, e);
        }
      }

      // Update database match record
      const updateData: Record<string, any> = {
        status: matchStatus,
        home_score: homeScore,
        away_score: awayScore,
        minute: elapsedMinute
      };

      if (events) updateData.events = events;
      if (lineups) updateData.lineups = lineups;
      if (stats) updateData.stats = stats;

      const { error: updateError } = await supabase
        .from("matches")
        .update(updateData)
        .eq("api_id", apiMatchId);

      if (updateError) {
        console.error(`Failed to update match ${apiMatchId} in database:`, updateError);
      } else {
        recordsUpdated++;
      }
    }

  } catch (err: any) {
    status = "error";
    errorMessage = err.message || String(err);
    console.error("Error in sync-live-matches:", errorMessage);
  } finally {
    const executionTime = Date.now() - startTime;
    await supabase.from("sync_logs").insert({
      function_name: "sync-live-matches",
      status,
      records_updated: recordsUpdated,
      api_calls_count: apiCalls,
      execution_time_ms: executionTime,
      error_message: errorMessage || null
    });
  }

  return new Response(
    JSON.stringify({ status, recordsUpdated, apiCalls, executionTimeMs: Date.now() - startTime }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: status === "success" ? 200 : 500,
    }
  );
});
