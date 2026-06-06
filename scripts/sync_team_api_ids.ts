import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

const apiKey = process.env.RAPIDAPI_KEY || '';

const baseDomain = "https://v3.football.api-sports.io";
const headers = { "x-apisports-key": apiKey };

// Map team names to our database codes
const TEAM_NAME_TO_CODE: Record<string, string> = {
  "Mexico": "MEX",
  "South Africa": "RSA",
  "South Korea": "KOR",
  "Korea Republic": "KOR",
  "Czech Republic": "CZE",
  "Czechia": "CZE",
  "Canada": "CAN",
  "Bosnia & Herzegovina": "BIH",
  "Bosnia and Herzegovina": "BIH",
  "Qatar": "QAT",
  "Switzerland": "SUI",
  "Brazil": "BRA",
  "Morocco": "MAR",
  "Haiti": "HTI",
  "Scotland": "SCO",
  "USA": "USA",
  "United States": "USA",
  "Paraguay": "PRY",
  "Australia": "AUS",
  "Turkey": "TUR",
  "Türkiye": "TUR",
  "Germany": "GER",
  "Curaçao": "CUW",
  "Curacao": "CUW",
  "Ivory Coast": "CIV",
  "Côte d'Ivoire": "CIV",
  "Ecuador": "ECU",
  "Netherlands": "NED",
  "Japan": "JPN",
  "Sweden": "SWE",
  "Tunisia": "TUN",
  "Belgium": "BEL",
  "Egypt": "EGY",
  "Iran": "IRN",
  "IR Iran": "IRN",
  "New Zealand": "NZL",
  "Spain": "ESP",
  "Cabo Verde": "CPV",
  "Cape Verde": "CPV",
  "Saudi Arabia": "KSA",
  "Uruguay": "URU",
  "France": "FRA",
  "Senegal": "SEN",
  "Iraq": "IRQ",
  "Norway": "NOR",
  "Argentina": "ARG",
  "Algeria": "ALG",
  "Austria": "AUT",
  "Jordan": "JOR",
  "Portugal": "POR",
  "Congo DR": "COD",
  "DR Congo": "COD",
  "Uzbekistan": "UZB",
  "Colombia": "COL",
  "England": "ENG",
  "Croatia": "CRO",
  "Ghana": "GHA",
  "Panama": "PAN"
};

async function sync() {
  console.log('Fetching teams from API-Football...');
  const res = await fetch(`${baseDomain}/teams?league=1&season=2026`, { headers });
  if (!res.ok) {
    throw new Error(`API returned HTTP ${res.status}`);
  }
  const body = await res.json();
  const apiTeams = body?.response || [];
  console.log(`Fetched ${apiTeams.length} teams from API`);

  // Fetch teams in DB
  const { data: dbTeams, error: dbError } = await supabase.from('teams').select('id, code, name');
  if (dbError) throw dbError;

  let matchedCount = 0;
  for (const item of apiTeams) {
    const apiTeamId = item.team.id;
    const apiName = item.team.name;
    const apiCode = item.team.code; // e.g. "ARG"

    // Try match by code first, then name mapping
    let matchedCode = apiCode;
    if (!matchedCode || !dbTeams.some(t => t.code === matchedCode)) {
      matchedCode = TEAM_NAME_TO_CODE[apiName];
    }

    if (matchedCode) {
      const dbTeam = dbTeams.find(t => t.code === matchedCode);
      if (dbTeam) {
        console.log(`Matching API Team: ${apiName} (${apiTeamId}) -> DB Team: ${dbTeam.name} (${dbTeam.code})`);
        const { error: updateError } = await supabase
          .from('teams')
          .update({ api_id: apiTeamId })
          .eq('id', dbTeam.id);
        
        if (updateError) {
          console.error(`Error updating team ${dbTeam.code}:`, updateError);
        } else {
          matchedCount++;
        }
      }
    } else {
      console.warn(`Unmatched API Team: ${apiName}`);
    }
  }

  console.log(`Successfully matched and updated ${matchedCount}/${dbTeams.length} teams in the database.`);
}

sync().catch(console.error);
