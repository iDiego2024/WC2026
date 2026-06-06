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

// Mapeo canónico de 2026 -> 2022 API Team IDs
const TEAM_MAP: Record<string, number> = {
  // Directos (existían en 2022)
  "BEL": 1, // Belgium
  "FRA": 2, // France
  "CRO": 3, // Croatia
  "BRA": 6, // Brazil
  "URU": 7, // Uruguay
  "ESP": 9, // Spain
  "ENG": 10, // England
  "JPN": 12, // Japan
  "SEN": 13, // Senegal
  "SUI": 15, // Switzerland
  "MEX": 16, // Mexico
  "KOR": 17, // South Korea
  "AUS": 20, // Australia
  "IRN": 22, // Iran
  "KSA": 23, // Saudi Arabia
  "GER": 25, // Germany
  "ARG": 26, // Argentina
  "POR": 27, // Portugal
  "TUN": 28, // Tunisia
  "MAR": 31, // Morocco
  "NED": 1118, // Netherlands
  "GHA": 1504, // Ghana
  "QAT": 1569, // Qatar
  "ECU": 2382, // Ecuador
  "USA": 2384, // USA
  "CAN": 5529, // Canada
  
  // Proxies (no estaban en 2022, mapeados a selecciones del mismo continente/nivel de 2022)
  "CZE": 24,   // Czechia -> Poland (UEFA)
  "RSA": 1530, // South Africa -> Cameroon (CAF)
  "BIH": 14,   // Bosnia -> Serbia (UEFA)
  "HTI": 29,   // Haiti -> Costa Rica (CONCACAF)
  "SCO": 767,  // Scotland -> Wales (UEFA)
  "PRY": 2382, // Paraguay -> Ecuador (CONMEBOL)
  "TUR": 21,   // Turkey -> Denmark (UEFA)
  "CUW": 29,   // Curaçao -> Costa Rica (CONCACAF)
  "CIV": 1530, // Ivory Coast -> Cameroon (CAF)
  "SWE": 21,   // Sweden -> Denmark (UEFA)
  "EGY": 28,   // Egypt -> Tunisia (CAF)
  "NZL": 20,   // New Zealand -> Australia (OFC->OFC/AFC proxy)
  "CPV": 1504, // Cabo Verde -> Ghana (CAF)
  "IRQ": 22,   // Iraq -> Iran (AFC)
  "NOR": 21,   // Norway -> Denmark (UEFA)
  "ALG": 28,   // Algeria -> Tunisia (CAF)
  "AUT": 15,   // Austria -> Switzerland (UEFA)
  "JOR": 23,   // Jordan -> Saudi Arabia (AFC)
  "COD": 1530, // Congo DR -> Cameroon (CAF)
  "UZB": 22,   // Uzbekistan -> Iran (AFC)
  "COL": 2382, // Colombia -> Ecuador (CONMEBOL)
  "PAN": 29    // Panama -> Costa Rica (CONCACAF)
};

async function run() {
  console.log('1. Updating team API IDs in Supabase...');
  const { data: dbTeams, error: teamsError } = await supabase.from('teams').select('id, code');
  if (teamsError) throw teamsError;

  for (const t of dbTeams) {
    const apiId = TEAM_MAP[t.code];
    if (apiId) {
      await supabase.from('teams').update({ api_id: apiId }).eq('id', t.id);
    }
  }
  console.log('Team API IDs updated successfully.');

  console.log('2. Fetching 2022 fixtures from API-Football...');
  const res = await fetch(`${baseDomain}/fixtures?league=1&season=2022`, { headers });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const body = await res.json();
  const apiMatches = body?.response || [];
  console.log(`Fetched ${apiMatches.length} matches from 2022 World Cup.`);

  // Separate group stage and knockout matches
  const apiGroupMatches = apiMatches.filter((m: any) => m.league.round.includes('Group Stage'));
  const apiKnockoutMatches = apiMatches.filter((m: any) => !m.league.round.includes('Group Stage'));

  console.log('3. Updating match API IDs in Supabase...');
  const { data: dbMatches, error: matchesError } = await supabase
    .from('matches')
    .select('id, stage, home_team_id, away_team_id, teams:home_team_id(code), away_teams:away_team_id(code)')
    .order('date');
  if (matchesError) throw matchesError;

  let groupIdx = 0;
  let koIdx = 0;

  for (const m of dbMatches) {
    const isGroup = m.stage === 'Group Stage';
    let apiId: number | null = null;

    const homeTeam = m.teams as any;
    const awayTeam = m.away_teams as any;
    if (isGroup && homeTeam?.code && awayTeam?.code) {
      // Find matching group fixture in 2022 by codes if possible
      const homeApiId = TEAM_MAP[homeTeam.code];
      const awayApiId = TEAM_MAP[awayTeam.code];

      const matchFixture = apiGroupMatches.find((f: any) => 
        (f.teams.home.id === homeApiId && f.teams.away.id === awayApiId) ||
        (f.teams.home.id === awayApiId && f.teams.away.id === homeApiId)
      );

      if (matchFixture) {
        apiId = matchFixture.fixture.id;
      } else {
        // Fallback: assign sequentially from 2022 group matches
        const f = apiGroupMatches[groupIdx % apiGroupMatches.length];
        apiId = f.fixture.id;
        groupIdx++;
      }
    } else {
      // Knockout stage: assign sequentially from 2022 knockout matches
      const f = apiKnockoutMatches[koIdx % apiKnockoutMatches.length];
      apiId = f.fixture.id;
      koIdx++;
    }

    if (apiId) {
      await supabase.from('matches').update({ api_id: apiId }).eq('id', m.id);
    }
  }

  console.log('Match API IDs mapped and updated successfully.');
}

run().catch(console.error);
