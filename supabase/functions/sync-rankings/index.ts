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
  let errorMessage = "";

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("VITE_SUPABASE_ANON_KEY") || "";

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Fetch all teams
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("*");
    if (teamsError) throw teamsError;

    // 2. Fetch all finished matches in chronological order
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("*")
      .eq("status", "finished")
      .order("date", { ascending: true });
    if (matchesError) throw matchesError;

    // Initialize ELO map using FIFA rank: ELO = 1600 - (fifa_rank * 6)
    const eloMap: Record<string, number> = {};
    teams.forEach((t: any) => {
      eloMap[t.id] = 1600 - (t.fifa_rank || 50) * 6;
    });

    // Tracking forms and streaks
    const teamForms: Record<string, string[]> = {};
    const teamStreaks: Record<string, { type: string; count: number }> = {};
    
    teams.forEach((t: any) => {
      teamForms[t.id] = [];
      teamStreaks[t.id] = { type: "", count: 0 };
    });

    // 3. Process matches to calculate dynamic ELO and update forms
    const K = 32;
    for (const match of matches) {
      const homeId = match.home_team_id;
      const awayId = match.away_team_id;
      if (!homeId || !awayId) continue;

      const homeElo = eloMap[homeId] || 1200;
      const awayElo = eloMap[awayId] || 1200;

      // Expected outcomes
      const expHome = 1 / (10 ** ((awayElo - homeElo) / 400) + 1);
      const expAway = 1 - expHome;

      // Actual outcomes
      let actHome = 0.5;
      let actAway = 0.5;
      let homeResult = "D";
      let awayResult = "D";

      if (match.home_score > match.away_score) {
        actHome = 1;
        actAway = 0;
        homeResult = "W";
        awayResult = "L";
      } else if (match.home_score < match.away_score) {
        actHome = 0;
        actAway = 1;
        homeResult = "L";
        awayResult = "W";
      }

      // Calculate dynamic rating adjustments
      eloMap[homeId] = Math.round(homeElo + K * (actHome - expHome));
      eloMap[awayId] = Math.round(awayElo + K * (actAway - expAway));

      // Append match outcomes to team forms (max 5 matches)
      teamForms[homeId].push(homeResult);
      if (teamForms[homeId].length > 5) teamForms[homeId].shift();

      teamForms[awayId].push(awayResult);
      if (teamForms[awayId].length > 5) teamForms[awayId].shift();

      // Update streaks
      const updateStreak = (teamId: string, result: string) => {
        const current = teamStreaks[teamId];
        if (current.type === result) {
          current.count++;
        } else {
          current.type = result;
          current.count = 1;
        }
      };

      updateStreak(homeId, homeResult);
      updateStreak(awayId, awayResult);
    }

    // 4. Save rankings back to the database
    for (const team of teams) {
      const finalElo = eloMap[team.id];
      const form = teamForms[team.id];
      const streakObj = teamStreaks[team.id];
      const streakStr = streakObj.type ? `${streakObj.count}${streakObj.type}` : "0D";

      const { error: updateError } = await supabase
        .from("teams")
        .update({
          elo_rank: finalElo,
          recent_form: form,
          streak: streakStr
        })
        .eq("id", team.id);

      if (updateError) {
        console.error(`Error updating team ${team.name} rankings:`, updateError);
      } else {
        recordsUpdated++;
      }
    }

  } catch (err: any) {
    status = "error";
    errorMessage = err.message || String(err);
    console.error("Error in sync-rankings:", errorMessage);
  } finally {
    const executionTime = Date.now() - startTime;
    await supabase.from("sync_logs").insert({
      function_name: "sync-rankings",
      status,
      records_updated: recordsUpdated,
      api_calls_count: 0,
      execution_time_ms: executionTime,
      error_message: errorMessage || null
    });
  }

  return new Response(
    JSON.stringify({ status, recordsUpdated, executionTimeMs: Date.now() - startTime }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: status === "success" ? 200 : 500,
    }
  );
});
