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
      .select("id, code, fifa_rank, name");
    if (teamsError) throw teamsError;

    // Initialize ELO based on FIFA Rank to give realistic starting points
    // FIFA #1 Argentia gets ~1600, #100 gets ~1100
    const teamStats: Record<string, {
      id: string;
      code: string;
      name: string;
      elo: number;
      played: number;
      points: number;
      goals_for: number;
      goals_against: number;
      gd: number;
      form: string[];
      streak: string;
    }> = {};

    for (const t of teams || []) {
      const initialElo = 1600 - ((t.fifa_rank || 50) * 5);
      teamStats[t.id] = {
        id: t.id,
        code: t.code,
        name: t.name,
        elo: initialElo,
        played: 0,
        points: 0,
        goals_for: 0,
        goals_against: 0,
        gd: 0,
        form: [],
        streak: "0D"
      };
    }

    // 2. Fetch all finished matches in chronological order
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("id, home_team_id, away_team_id, home_score, away_score, status, date")
      .eq("status", "finished")
      .order("date", { ascending: true });

    if (matchesError) throw matchesError;

    console.log(`Processing ELO for ${matches?.length || 0} finished matches...`);

    // 3. Process matches chronologically
    for (const m of matches || []) {
      const home = teamStats[m.home_team_id];
      const away = teamStats[m.away_team_id];
      if (!home || !away) continue;

      const hScore = m.home_score ?? 0;
      const aScore = m.away_score ?? 0;

      // Update basic team stats
      home.played += 1;
      away.played += 1;
      home.goals_for += hScore;
      home.goals_against += aScore;
      away.goals_for += aScore;
      away.goals_against += hScore;

      let homeOutcome = 0.5;
      let awayOutcome = 0.5;

      if (hScore > aScore) {
        homeOutcome = 1.0;
        awayOutcome = 0.0;
        home.points += 3;
        home.form.push("W");
        away.form.push("L");
      } else if (hScore < aScore) {
        homeOutcome = 0.0;
        awayOutcome = 1.0;
        away.points += 3;
        home.form.push("L");
        away.form.push("W");
      } else {
        home.points += 1;
        away.points += 1;
        home.form.push("D");
        away.form.push("D");
      }

      // Calculate ELO update
      const kFactor = 32;
      const expectedHome = 1 / (1 + Math.pow(10, (away.elo - home.elo) / 400));
      const expectedAway = 1 / (1 + Math.pow(10, (home.elo - away.elo) / 400));

      home.elo = Math.round(home.elo + kFactor * (homeOutcome - expectedHome));
      away.elo = Math.round(away.elo + kFactor * (awayOutcome - expectedAway));
    }

    // 4. Update team streak string and slice form to last 10 matches
    for (const id of Object.keys(teamStats)) {
      const stats = teamStats[id];
      stats.gd = stats.goals_for - stats.goals_against;

      // Calculate streak (e.g. '3W', '1L', '2D')
      let streakVal = 0;
      let streakChar = 'D';
      if (stats.form.length > 0) {
        const lastResult = stats.form[stats.form.length - 1];
        streakChar = lastResult;
        for (let i = stats.form.length - 1; i >= 0; i--) {
          if (stats.form[i] === lastResult) {
            streakVal++;
          } else {
            break;
          }
        }
      }
      stats.streak = `${streakVal}${streakChar}`;
      
      // Keep last 10 results for form index
      stats.form = stats.form.slice(-10);

      // Perform DB Update
      const { error: updateError } = await supabase
        .from("teams")
        .update({
          elo_rating: stats.elo,
          played: stats.played,
          points: stats.points,
          goals_for: stats.goals_for,
          goals_against: stats.goals_against,
          goal_difference: stats.gd,
          recent_form: stats.form,
          streak: stats.streak,
          attack_rating: Math.max(30, Math.min(99, 50 + stats.goals_for * 2 - stats.played)),
          defense_rating: Math.max(30, Math.min(99, 90 - stats.goals_against * 2 + stats.played))
        })
        .eq("id", id);

      if (updateError) {
        console.error(`Error updating stats for team ${stats.code}:`, updateError);
      } else {
        recordsUpdated++;
      }
    }

  } catch (err: any) {
    status = "error";
    errorMessage = err.message || String(err);
    console.error("Error in sync-rankings-premium:", errorMessage);
  }

  return new Response(
    JSON.stringify({ status, recordsUpdated, executionTimeMs: Date.now() - startTime, errorMessage }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: status === "success" ? 200 : 500,
    }
  );
});
