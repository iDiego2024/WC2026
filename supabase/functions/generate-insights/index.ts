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
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("RAPIDAPI_KEY") || ""; // Fallback to key if defined

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Fetch top teams, matches, and stats from DB
    const { data: teams } = await supabase.from("teams").select("id, name, code, fifa_rank, elo_rating, played, points").order("elo_rating", { ascending: false }).limit(10);
    const { data: matches } = await supabase.from("matches").select("id, stage, home_team:home_team_id(name), away_team:away_team_id(name), status").limit(10);

    const prompt = `Analyze the following World Cup data and generate tournament insights.
Teams: ${JSON.stringify(teams)}
Matches: ${JSON.stringify(matches)}

Provide a JSON object with keys: "surprise_team", "most_offensive_team", "most_solid_team", "best_goalkeeper", "revelation_player", "must_watch_match".
For each key, provide a "title" and "description".

Example output format:
{
  "surprise_team": { "title": "Cabo Verde Sparking", "description": "Ranked low but holds a strong ELO..." },
  ...
}`;

    let jsonResult;
    try {
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (geminiRes.ok) {
        const resJson = await geminiRes.json();
        const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        jsonResult = JSON.parse(rawText.trim());
      } else {
        throw new Error(`Gemini HTTP error ${geminiRes.status}`);
      }
    } catch (e) {
      console.warn("Failed to fetch from Gemini API, falling back to rule-based insights:", e);
      // Fallback rule-based insights if API key is not configured or fails
      const topTeam = teams?.[0]?.name || "Argentina";
      const secondTeam = teams?.[1]?.name || "France";
      jsonResult = {
        "surprise_team": { "title": `${teams?.[teams.length - 1]?.name || "South Africa"} Rising`, "description": "Exhibiting high ELO growth relative to starting rank." },
        "most_offensive_team": { "title": `${topTeam} Domination`, "description": "Generating the highest expected goal output per match." },
        "most_solid_team": { "title": `${secondTeam} Defense`, "description": "Boasting a high defensive rating and low goals against." },
        "best_goalkeeper": { "title": "Golden Glove Race", "description": "Clean sheets and critical saves leading the stats leaderboard." },
        "revelation_player": { "title": "Breakout Star", "description": "Showing high efficiency and creative xA stats." },
        "must_watch_match": { "title": `${topTeam} vs ${secondTeam}`, "description": "Highly anticipated clash of top contender rankings." }
      };
    }

    // Insert into tournament_insights table
    for (const [key, value] of Object.entries(jsonResult)) {
      const { error } = await supabase
        .from("tournament_insights")
        .upsert({
          category: key,
          title: (value as any).title,
          description: (value as any).description,
          updated_at: new Date().toISOString()
        }, { onConflict: "category" });

      if (error) {
        console.error(`Error saving insight ${key}:`, error);
      } else {
        recordsUpdated++;
      }
    }

  } catch (err: any) {
    status = "error";
    errorMessage = err.message || String(err);
    console.error("Error in generate-insights:", errorMessage);
  }

  return new Response(
    JSON.stringify({ status, recordsUpdated, executionTimeMs: Date.now() - startTime, errorMessage }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: status === "success" ? 200 : 500,
    }
  );
});
