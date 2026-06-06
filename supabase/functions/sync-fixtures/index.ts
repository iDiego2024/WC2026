import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.107.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================
// SOURCE: fixturedownload.com (free, real WC2026 data)
// ============================================================
const ROUND_MAP: Record<number, string> = {
  1: "Group Stage", 2: "Group Stage", 3: "Group Stage",
  4: "Round of 32", 5: "Round of 16", 6: "Quarterfinals",
  7: "Semifinals", 8: "Final",
};

const ISO2_MAP: Record<string, string> = {
  "United States": "US", "USA": "US", "Canada": "CA", "Mexico": "MX",
  "Brazil": "BR", "Argentina": "AR", "Uruguay": "UY", "Colombia": "CO",
  "Ecuador": "EC", "Paraguay": "PY", "Venezuela": "VE", "Bolivia": "BO",
  "Germany": "DE", "France": "FR", "Spain": "ES", "England": "GB-ENG",
  "Portugal": "PT", "Netherlands": "NL", "Belgium": "BE", "Italy": "IT",
  "Croatia": "HR", "Switzerland": "CH", "Austria": "AT", "Denmark": "DK",
  "Sweden": "SE", "Norway": "NO", "Poland": "PL", "Ukraine": "UA",
  "Turkey": "TR", "Türkiye": "TR", "Romania": "RO", "Serbia": "RS",
  "Slovakia": "SK", "Czech Republic": "CZ", "Czechia": "CZ", "Slovenia": "SI",
  "Albania": "AL", "Georgia": "GE", "Scotland": "GB-SCT", "Iceland": "IS",
  "Bosnia and Herzegovina": "BA", "Hungary": "HU",
  "Japan": "JP", "South Korea": "KR", "Korea Republic": "KR",
  "Australia": "AU", "Iran": "IR", "IR Iran": "IR",
  "Saudi Arabia": "SA", "Qatar": "QA", "UAE": "AE", "Iraq": "IQ",
  "Uzbekistan": "UZ", "Jordan": "JO",
  "Senegal": "SN", "Morocco": "MA", "Egypt": "EG", "Nigeria": "NG",
  "Cameroon": "CM", "Ghana": "GH", "Tunisia": "TN", "Algeria": "DZ",
  "Congo DR": "CD", "South Africa": "ZA", "Cabo Verde": "CV",
  "Côte d'Ivoire": "CI",
  "New Zealand": "NZ", "Panama": "PA", "Costa Rica": "CR",
  "Honduras": "HN", "Jamaica": "JM", "Curaçao": "CW", "Haiti": "HT",
};

const STADIUM_MAP: Record<string, { name: string; city: string; capacity: number }> = {
  "New York/New Jersey Stadium": { name: "MetLife Stadium", city: "East Rutherford, NJ", capacity: 82500 },
  "Los Angeles Stadium": { name: "SoFi Stadium", city: "Los Angeles, CA", capacity: 70240 },
  "Dallas Stadium": { name: "AT&T Stadium", city: "Arlington, TX", capacity: 80000 },
  "San Francisco Bay Area Stadium": { name: "Levi's Stadium", city: "Santa Clara, CA", capacity: 68500 },
  "Miami Stadium": { name: "Hard Rock Stadium", city: "Miami, FL", capacity: 64767 },
  "Atlanta Stadium": { name: "Mercedes-Benz Stadium", city: "Atlanta, GA", capacity: 71000 },
  "Seattle Stadium": { name: "Lumen Field", city: "Seattle, WA", capacity: 68740 },
  "Houston Stadium": { name: "NRG Stadium", city: "Houston, TX", capacity: 72220 },
  "Philadelphia Stadium": { name: "Lincoln Financial Field", city: "Philadelphia, PA", capacity: 69796 },
  "Kansas City Stadium": { name: "Arrowhead Stadium", city: "Kansas City, MO", capacity: 76416 },
  "Boston Stadium": { name: "Gillette Stadium", city: "Foxborough, MA", capacity: 65878 },
  "BC Place Vancouver": { name: "BC Place", city: "Vancouver, BC", capacity: 54500 },
  "Toronto Stadium": { name: "BMO Field", city: "Toronto, ON", capacity: 30000 },
  "Mexico City Stadium": { name: "Estadio Azteca", city: "Mexico City, MX", capacity: 87523 },
  "Monterrey Stadium": { name: "Estadio BBVA", city: "Monterrey, MX", capacity: 53500 },
  "Guadalajara Stadium": { name: "Estadio Akron", city: "Guadalajara, MX", capacity: 47019 },
};

async function fetchFixturesFromWeb(): Promise<any[]> {
  const res = await fetch("https://fixturedownload.com/feed/json/fifa-world-cup-2026", {
    headers: { "User-Agent": "WC2026-Tracker/1.0" },
  });
  if (!res.ok) throw new Error(`fixturedownload.com HTTP ${res.status}`);
  return res.json();
}

// ============================================================
// MAIN HANDLER
// ============================================================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();
  let status = "success";
  let recordsUpdated = 0;
  let apiCalls = 0;
  let errorMessage = "";
  const dataSource = "fixturedownload.com";

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log("Fetching WC2026 fixtures from fixturedownload.com...");
    apiCalls++;
    const rawFixtures = await fetchFixturesFromWeb();
    console.log(`Fetched ${rawFixtures.length} raw fixtures`);

    if (!rawFixtures.length) throw new Error("No fixtures returned");

    // 1. Upsert groups A-L
    const groupEntries = ["A","B","C","D","E","F","G","H","I","J","K","L"].map(g => ({
      id: g, name: `Grupo ${g}`
    }));
    await supabase.from("groups").upsert(groupEntries, { onConflict: "id" });

    // 2. Upsert stadiums
    const stadiumDbIds: Record<string, string> = {};
    for (const [locKey, s] of Object.entries(STADIUM_MAP)) {
      const { data } = await supabase
        .from("stadiums")
        .upsert({ name: s.name, city: s.city, capacity: s.capacity }, { onConflict: "name" })
        .select("id, name").single();
      if (data) stadiumDbIds[locKey] = data.id;
    }

    // 3. Upsert teams
    const teamDbIds: Record<string, string> = {};
    const teamsMap: Record<string, string | null> = {};

    for (const f of rawFixtures) {
      const grp = f.Group || "";
      const gLetter = grp.startsWith("Group ") ? grp.replace("Group ", "") : null;
      for (const role of ["Home", "Away"]) {
        const name: string = f[`${role}Team`] || "";
        if (name && name !== "To be announced" && !/^\d/.test(name)) {
          if (!(name in teamsMap) || gLetter) teamsMap[name] = gLetter || teamsMap[name] || null;
        }
      }
    }

    for (const [name, grpLetter] of Object.entries(teamsMap)) {
      const code = name.substring(0, 3).toUpperCase();
      const flag = (ISO2_MAP[name] || name.substring(0, 2).toUpperCase()).substring(0, 10);
      const { data } = await supabase
        .from("teams")
        .upsert(
          { name, code, flag_code: flag, group_name: grpLetter || undefined },
          { onConflict: "name" }
        )
        .select("id, name").single();
      if (data) teamDbIds[name] = data.id;
    }

    // 4. Upsert matches
    const matchesToUpsert = rawFixtures.map((f: any) => {
      const homeName: string = f.HomeTeam || "";
      const awayName: string = f.AwayTeam || "";
      const grp: string = f.Group || "";
      const gLetter = grp.startsWith("Group ") ? grp.replace("Group ", "") : null;
      const roundNum: number = f.RoundNumber || 1;
      const hs = f.HomeTeamScore;
      const aws = f.AwayTeamScore;

      return {
        home_team_id: teamDbIds[homeName] || null,
        away_team_id: teamDbIds[awayName] || null,
        stadium_id: stadiumDbIds[f.Location || ""] || null,
        date: f.DateUtc?.replace("Z", "+00") || null,
        group_name: gLetter,
        stage: ROUND_MAP[roundNum] || "Group Stage",
        status: (hs !== null && hs !== undefined && aws !== null && aws !== undefined) ? "finished" : "scheduled",
        home_score: hs ?? null,
        away_score: aws ?? null,
        api_id: f.MatchNumber,
      };
    });

    const { error: matchErr } = await supabase
      .from("matches")
      .upsert(matchesToUpsert, { onConflict: "api_id" });

    if (matchErr) throw matchErr;
    recordsUpdated = matchesToUpsert.length;

    console.log(`✅ Upserted ${recordsUpdated} matches`);

  } catch (err: any) {
    status = "error";
    errorMessage = err.message || String(err);
    console.error("sync-fixtures error:", errorMessage);
  } finally {
    const executionTime = Date.now() - startTime;
    await supabase.from("sync_logs").insert({
      function_name: "sync-fixtures",
      status,
      records_updated: recordsUpdated,
      api_calls_count: apiCalls,
      execution_time_ms: executionTime,
      error_message: errorMessage || null,
    });
  }

  return new Response(
    JSON.stringify({ status, recordsUpdated, dataSource, executionTimeMs: Date.now() - startTime, error: errorMessage || null }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: status === "success" ? 200 : 500 }
  );
});
