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

// Map team names/codes to our database codes
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
  console.log('Fetching fixtures from API-Football...');
  const res = await fetch(`${baseDomain}/fixtures?league=1&season=2026`, { headers });
  if (!res.ok) {
    throw new Error(`API returned HTTP ${res.status}`);
  }
  const body = await res.json();
  const fixtures = body?.response || [];
  console.log(`Fetched ${fixtures.length} fixtures from API`);

  // Extract unique teams
  const apiTeams = new Map<number, { name: string; code: string }>();
  for (const f of fixtures) {
    if (f.teams.home && f.teams.home.id) {
      apiTeams.set(f.teams.home.id, { name: f.teams.home.name, code: f.teams.home.code });
    }
    if (f.teams.away && f.teams.away.id) {
      apiTeams.set(f.teams.away.id, { name: f.teams.away.name, code: f.teams.away.code });
    }
  }
  console.log(`Found ${apiTeams.size} unique teams in API fixtures.`);

  // Fetch teams in DB
  const { data: dbTeams, error: dbError } = await supabase.from('teams').select('id, code, name');
  if (dbError) throw dbError;

  let matchedCount = 0;
  for (const [apiTeamId, info] of apiTeams.entries()) {
    let matchedCode = info.code;
    if (!matchedCode || !dbTeams.some(t => t.code === matchedCode)) {
      matchedCode = TEAM_NAME_TO_CODE[info.name];
    }

    if (matchedCode) {
      const dbTeam = dbTeams.find(t => t.code === matchedCode);
      if (dbTeam) {
        console.log(`Matching: ${info.name} (${apiTeamId}) -> DB Team: ${dbTeam.name} (${dbTeam.code})`);
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
      console.warn(`Unmatched API Team: ${info.name} (${apiTeamId})`);
    }
  }

  // Check if we can also map the match API IDs!
  console.log('\nMapping match API IDs...');
  let matchedMatches = 0;
  const { data: dbMatches, error: matchDbError } = await supabase
    .from('matches')
    .select('id, stage, home_team_id, away_team_id, teams:home_team_id(code), away_teams:away_team_id(code)');
  if (matchDbError) throw matchDbError;

  // Build match maps
  // For group stage matches, we can match exactly by home_team and away_team
  for (const f of fixtures) {
    const apiHomeId = f.teams.home.id;
    const apiAwayId = f.teams.away.id;
    const apiMatchId = f.fixture.id;

    // Get DB team for home and away
    const homeCode = TEAM_NAME_TO_CODE[f.teams.home.name] || f.teams.home.code;
    const awayCode = TEAM_NAME_TO_CODE[f.teams.away.name] || f.teams.away.code;

    if (homeCode && awayCode) {
      const match = dbMatches.find((m: any) => {
        return m.teams?.code === homeCode && m.away_teams?.code === awayCode;
      });

      if (match) {
        const { error: updateError } = await supabase
          .from('matches')
          .update({ api_id: apiMatchId })
          .eq('id', match.id);
        if (updateError) {
          console.error(`Error updating match ${match.id}:`, updateError);
        } else {
          matchedMatches++;
        }
      }
    }
  }

  console.log(`Successfully mapped ${matchedCount}/${dbTeams.length} teams and ${matchedMatches} matches.`);
}

sync().catch(console.error);
