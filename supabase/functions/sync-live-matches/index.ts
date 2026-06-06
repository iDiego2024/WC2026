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

    const baseDomain = "https://v3.football.api-sports.io";
    const headers = { "x-apisports-key": apiKey };

    // Fetch team maps (api_id -> uuid)
    const { data: dbTeams, error: teamsErr } = await supabase.from("teams").select("id, api_id");
    if (teamsErr) throw teamsErr;
    const teamIdMap: Record<number, string> = {};
    for (const t of dbTeams || []) {
      if (t.api_id) teamIdMap[t.api_id] = t.id;
    }

    // Fetch matches that need syncing (e.g., live or finished matches, or scheduled matches that we want to populate)
    const { data: dbMatches, error: matchesErr } = await supabase
      .from("matches")
      .select("id, api_id, status")
      .not("api_id", "is", null)
      .limit(5); // Process in small batches to respect rate limits (100 req/day)

    if (matchesErr) throw matchesErr;

    console.log(`Processing ${dbMatches?.length || 0} matches...`);

    for (const match of dbMatches || []) {
      const matchId = match.id;
      const apiMatchId = match.api_id;

      // 1. Fetch & Sync Statistics
      try {
        apiCalls++;
        const statsRes = await fetch(`${baseDomain}/fixtures/statistics?fixture=${apiMatchId}`, { headers });
        if (statsRes.ok) {
          const statsBody = await statsRes.json();
          const statsArr = statsBody?.response || [];
          
          if (statsArr.length >= 2) {
            const getStatVal = (teamIdx: number, type: string): any => {
              const item = statsArr[teamIdx]?.statistics?.find((s: any) => s.type === type);
              if (!item || item.value === null) return null;
              if (typeof item.value === 'string' && item.value.includes('%')) {
                return parseInt(item.value.replace('%', ''), 10);
              }
              return item.value;
            };

            const statsPayload = {
              match_id: matchId,
              possession_home: getStatVal(0, "Ball Possession"),
              possession_away: getStatVal(1, "Ball Possession"),
              shots_home: getStatVal(0, "Total Shots"),
              shots_away: getStatVal(1, "Total Shots"),
              shots_on_target_home: getStatVal(0, "Shots on Goal"),
              shots_on_target_away: getStatVal(1, "Shots on Goal"),
              corners_home: getStatVal(0, "Corner Kicks"),
              corners_away: getStatVal(1, "Corner Kicks"),
              fouls_home: getStatVal(0, "Fouls"),
              fouls_away: getStatVal(1, "Fouls"),
              yellow_cards_home: getStatVal(0, "Yellow Cards"),
              yellow_cards_away: getStatVal(1, "Yellow Cards"),
              red_cards_home: getStatVal(0, "Red Cards"),
              red_cards_away: getStatVal(1, "Red Cards"),
              passes_home: getStatVal(0, "Total passes"),
              passes_away: getStatVal(1, "Total passes"),
              pass_accuracy_home: getStatVal(0, "Passes %"),
              pass_accuracy_away: getStatVal(1, "Passes %"),
              xg_home: getStatVal(0, "expected_goals") ? parseFloat(getStatVal(0, "expected_goals")) : null,
              xg_away: getStatVal(1, "expected_goals") ? parseFloat(getStatVal(1, "expected_goals")) : null
            };

            await supabase.from("match_statistics").upsert(statsPayload, { onConflict: "match_id" });
          }
        }
      } catch (e) {
        console.error(`Error syncing stats for match ${apiMatchId}:`, e);
      }

      // 2. Fetch & Sync Events
      try {
        apiCalls++;
        const eventsRes = await fetch(`${baseDomain}/fixtures/events?fixture=${apiMatchId}`, { headers });
        if (eventsRes.ok) {
          const eventsBody = await eventsRes.json();
          const eventsArr = eventsBody?.response || [];

          // Clean existing events
          await supabase.from("match_events").delete().eq("match_id", matchId);

          const eventsToInsert = eventsArr.map((ev: any) => ({
            match_id: matchId,
            minute: ev.time.elapsed,
            event_type: ev.type?.toLowerCase() || 'other',
            player_name: ev.player?.name || 'Unknown',
            team_id: teamIdMap[ev.team?.id] || null,
            description: ev.detail || ev.comments || ''
          }));

          if (eventsToInsert.length > 0) {
            await supabase.from("match_events").insert(eventsToInsert);
          }
        }
      } catch (e) {
        console.error(`Error syncing events for match ${apiMatchId}:`, e);
      }

      // 3. Fetch & Sync Lineups
      try {
        apiCalls++;
        const lineupsRes = await fetch(`${baseDomain}/fixtures/lineups?fixture=${apiMatchId}`, { headers });
        if (lineupsRes.ok) {
          const lineupsBody = await lineupsRes.json();
          const lineupsArr = lineupsBody?.response || [];

          // Clean existing lineups
          await supabase.from("lineups").delete().eq("match_id", matchId);

          const lineupsToInsert: any[] = [];
          for (const lineup of lineupsArr) {
            const teamId = teamIdMap[lineup.team?.id] || null;
            
            // XI Titular
            for (const item of lineup.startXI || []) {
              lineupsToInsert.push({
                match_id: matchId,
                team_id: teamId,
                player_name: item.player?.name || 'Unknown',
                position: item.player?.pos || 'M',
                starter: true,
                shirt_number: item.player?.number || null
              });
            }

            // Suplentes
            for (const item of lineup.substitutes || []) {
              lineupsToInsert.push({
                match_id: matchId,
                team_id: teamId,
                player_name: item.player?.name || 'Unknown',
                position: item.player?.pos || 'M',
                starter: false,
                shirt_number: item.player?.number || null
              });
            }
          }

          if (lineupsToInsert.length > 0) {
            await supabase.from("lineups").insert(lineupsToInsert);
          }
        }
      } catch (e) {
        console.error(`Error syncing lineups for match ${apiMatchId}:`, e);
      }

      recordsUpdated++;
    }

  } catch (err: any) {
    status = "error";
    errorMessage = err.message || String(err);
    console.error("Error in sync-live-matches:", errorMessage);
  }

  return new Response(
    JSON.stringify({ status, recordsUpdated, apiCalls, executionTimeMs: Date.now() - startTime, errorMessage }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: status === "success" ? 200 : 500,
    }
  );
});
