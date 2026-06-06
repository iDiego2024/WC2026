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

// Mapeo de nombre del feed → código de equipo canónico en BD
// Estos códigos existen en la tabla teams con constraint UNIQUE (code)
const FEED_NAME_TO_CODE: Record<string, string> = {
  // Grupo A
  "Mexico":                 "MEX",
  "South Africa":           "RSA",
  "Korea Republic":         "KOR",
  "Czechia":                "CZE",
  // Grupo B
  "Canada":                 "CAN",
  "Bosnia and Herzegovina": "BIH",
  "Qatar":                  "QAT",
  "Switzerland":            "SUI",
  // Grupo C
  "Brazil":                 "BRA",
  "Morocco":                "MAR",
  "Haiti":                  "HTI",
  "Scotland":               "SCO",
  // Grupo D
  "USA":                    "USA",
  "Paraguay":               "PRY",
  "Australia":              "AUS",
  "Türkiye":                "TUR",
  "Turkey":                 "TUR", // alias
  // Grupo E
  "Germany":                "GER",
  "Curaçao":                "CUW",
  "Côte d'Ivoire":          "CIV",
  "Ecuador":                "ECU",
  // Grupo F
  "Netherlands":            "NED",
  "Japan":                  "JPN",
  "Sweden":                 "SWE",
  "Tunisia":                "TUN",
  // Grupo G
  "Belgium":                "BEL",
  "Egypt":                  "EGY",
  "IR Iran":                "IRN",
  "Iran":                   "IRN", // alias
  "New Zealand":            "NZL",
  // Grupo H
  "Spain":                  "ESP",
  "Cabo Verde":             "CPV",
  "Saudi Arabia":           "KSA",
  "Uruguay":                "URU",
  // Grupo I
  "France":                 "FRA",
  "Senegal":                "SEN",
  "Iraq":                   "IRQ",
  "Norway":                 "NOR",
  // Grupo J
  "Argentina":              "ARG",
  "Algeria":                "ALG",
  "Austria":                "AUT",
  "Jordan":                 "JOR",
  // Grupo K
  "Portugal":               "POR",
  "Congo DR":               "COD",
  "Uzbekistan":             "UZB",
  "Colombia":               "COL",
  // Grupo L
  "England":                "ENG",
  "Croatia":                "CRO",
  "Ghana":                  "GHA",
  "Panama":                 "PAN",
};

// Mapeo location del feed → UUID de estadio en BD (IDs semánticos del seed)
const LOCATION_TO_STADIUM_ID: Record<string, string> = {
  "Mexico City Stadium":           "10000000-0000-0000-0000-000000000001",
  "New York/New Jersey Stadium":   "10000000-0000-0000-0000-000000000002",
  "Dallas Stadium":                "10000000-0000-0000-0000-000000000003",
  "Kansas City Stadium":           "10000000-0000-0000-0000-000000000004",
  "Houston Stadium":               "10000000-0000-0000-0000-000000000005",
  "Atlanta Stadium":               "10000000-0000-0000-0000-000000000006",
  "Los Angeles Stadium":           "10000000-0000-0000-0000-000000000007",
  "Philadelphia Stadium":          "10000000-0000-0000-0000-000000000008",
  "Seattle Stadium":               "10000000-0000-0000-0000-000000000009",
  "San Francisco Bay Area Stadium": "10000000-0000-0000-0000-000000000010",
  "Boston Stadium":                "10000000-0000-0000-0000-000000000011",
  "Miami Stadium":                 "10000000-0000-0000-0000-000000000012",
  "BC Place Vancouver":            "10000000-0000-0000-0000-000000000013",
  "Monterrey Stadium":             "10000000-0000-0000-0000-000000000014",
  "Guadalajara Stadium":           "10000000-0000-0000-0000-000000000015",
  "Toronto Stadium":               "10000000-0000-0000-0000-000000000016",
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

    // 1. Upsert groups A-L (safe, idempotent)
    const groupEntries = ["A","B","C","D","E","F","G","H","I","J","K","L"].map(g => ({
      id: g, name: `Grupo ${g}`
    }));
    await supabase.from("groups").upsert(groupEntries, { onConflict: "id" });

    // 2. Build team ID map by reading existing teams from DB (NO UPSERT NEEDED)
    //    Teams are managed by the seed, not by this function.
    const { data: teamsInDb, error: teamsErr } = await supabase
      .from("teams")
      .select("id, code");
    
    if (teamsErr) throw new Error(`Failed to fetch teams: ${teamsErr.message}`);
    
    const CODE_TO_ID: Record<string, string> = {};
    for (const t of teamsInDb || []) {
      CODE_TO_ID[t.code] = t.id;
    }
    console.log(`Loaded ${Object.keys(CODE_TO_ID).length} teams from DB`);

    // 3. Build stadium ID map (already seeded with semantic IDs)
    //    The LOCATION_TO_STADIUM_ID map directly resolves feed locations to UUIDs.

    // 4. Upsert matches using api_id as conflict key
    //    Home/away team IDs are resolved using FEED_NAME_TO_CODE + CODE_TO_ID
    let nullHomeCount = 0;
    let nullAwayCount = 0;

    const matchesToUpsert = rawFixtures.map((f: any) => {
      const homeName: string = f.HomeTeam || "";
      const awayName: string = f.AwayTeam || "";
      const location: string = f.Location || "";
      const grp: string = f.Group || "";
      const gLetter = grp.startsWith("Group ") ? grp.replace("Group ", "") : null;
      const roundNum: number = f.RoundNumber || 1;

      const homeCode = FEED_NAME_TO_CODE[homeName];
      const awayCode = FEED_NAME_TO_CODE[awayName];
      const homeId = homeCode ? CODE_TO_ID[homeCode] || null : null;
      const awayId = awayCode ? CODE_TO_ID[awayCode] || null : null;
      const stadiumId = LOCATION_TO_STADIUM_ID[location] || null;

      if (!homeId && homeName && homeName !== "To be announced" && !/^\d/.test(homeName)) {
        console.warn(`Unmapped home team: "${homeName}"`);
        nullHomeCount++;
      }
      if (!awayId && awayName && awayName !== "To be announced" && !/^\d/.test(awayName)) {
        console.warn(`Unmapped away team: "${awayName}"`);
        nullAwayCount++;
      }

      const hs = f.HomeTeamScore;
      const aws = f.AwayTeamScore;

      return {
        home_team_id: homeId,
        away_team_id: awayId,
        stadium_id: stadiumId,
        date: f.DateUtc?.replace(" ", "T").replace("Z", "+00:00") || null,
        group_name: gLetter,
        stage: ROUND_MAP[roundNum] || "Group Stage",
        status: (hs !== null && hs !== undefined && aws !== null && aws !== undefined) ? "finished" : "scheduled",
        home_score: hs ?? null,
        away_score: aws ?? null,
        api_id: f.MatchNumber,
      };
    });

    // Upsert using api_id as conflict key (no null checks fail here)
    const { error: matchErr } = await supabase
      .from("matches")
      .upsert(matchesToUpsert, { onConflict: "api_id" });

    if (matchErr) throw matchErr;
    recordsUpdated = matchesToUpsert.length;

    console.log(`✅ Upserted ${recordsUpdated} matches`);
    if (nullHomeCount > 0 || nullAwayCount > 0) {
      console.warn(`⚠️ Unmapped teams: ${nullHomeCount} home, ${nullAwayCount} away`);
    }

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
