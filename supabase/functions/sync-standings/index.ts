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

    // 2. Fetch all finished group stage matches
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("*")
      .eq("status", "finished")
      .eq("stage", "Group Stage");
    if (matchesError) throw matchesError;

    // Initialize standings map
    const statsMap: Record<string, {
      played: number;
      goals_for: number;
      goals_against: number;
      points: number;
    }> = {};

    teams.forEach((t: any) => {
      statsMap[t.id] = { played: 0, goals_for: 0, goals_against: 0, points: 0 };
    });

    // 3. Process matches
    matches.forEach((match: any) => {
      const homeId = match.home_team_id;
      const awayId = match.away_team_id;
      if (!homeId || !awayId) return;

      const homeScore = match.home_score || 0;
      const awayScore = match.away_score || 0;

      const homeStats = statsMap[homeId] || { played: 0, goals_for: 0, goals_against: 0, points: 0 };
      const awayStats = statsMap[awayId] || { played: 0, goals_for: 0, goals_against: 0, points: 0 };

      homeStats.played++;
      awayStats.played++;
      homeStats.goals_for += homeScore;
      homeStats.goals_against += awayScore;
      awayStats.goals_for += awayScore;
      awayStats.goals_against += homeScore;

      if (homeScore > awayScore) {
        homeStats.points += 3;
      } else if (homeScore < awayScore) {
        awayStats.points += 3;
      } else {
        homeStats.points += 1;
        awayStats.points += 1;
      }

      statsMap[homeId] = homeStats;
      statsMap[awayId] = awayStats;
    });

    // 4. Update teams table
    for (const team of teams) {
      const stats = statsMap[team.id] || { played: 0, goals_for: 0, goals_against: 0, points: 0 };
      const goalDifference = stats.goals_for - stats.goals_against;

      const { error: updateError } = await supabase
        .from("teams")
        .update({
          played: stats.played,
          goals_for: stats.goals_for,
          goals_against: stats.goals_against,
          goal_difference: goalDifference,
          points: stats.points
        })
        .eq("id", team.id);

      if (updateError) {
        console.error(`Error updating standings for team ${team.name}:`, updateError);
      } else {
        recordsUpdated++;
      }
    }

  } catch (err: any) {
    status = "error";
    errorMessage = err.message || String(err);
    console.error("Error in sync-standings:", errorMessage);
  } finally {
    const executionTime = Date.now() - startTime;
    await supabase.from("sync_logs").insert({
      function_name: "sync-standings",
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
