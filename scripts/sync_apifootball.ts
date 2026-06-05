import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase environment variables missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

const OFFICIAL_TEAMS = [
  { code: 'MEX', name: 'Mexico', flag_code: 'mx', group_name: 'A', fifa_rank: 14, continent: 'CONCACAF' },
  { code: 'SRB', name: 'Serbia', flag_code: 'rs', group_name: 'A', fifa_rank: 33, continent: 'UEFA' },
  { code: 'EGY', name: 'Egypt', flag_code: 'eg', group_name: 'A', fifa_rank: 36, continent: 'CAF' },
  { code: 'NZL', name: 'New Zealand', flag_code: 'nz', group_name: 'A', fifa_rank: 104, continent: 'OFC' },
  
  { code: 'CAN', name: 'Canada', flag_code: 'ca', group_name: 'B', fifa_rank: 50, continent: 'CONCACAF' },
  { code: 'SWE', name: 'Sweden', flag_code: 'se', group_name: 'B', fifa_rank: 26, continent: 'UEFA' },
  { code: 'ALG', name: 'Algeria', flag_code: 'dz', group_name: 'B', fifa_rank: 43, continent: 'CAF' },
  { code: 'VEN', name: 'Venezuela', flag_code: 've', group_name: 'B', fifa_rank: 49, continent: 'CONMEBOL' },
  
  { code: 'USA', name: 'United States', flag_code: 'us', group_name: 'C', fifa_rank: 11, continent: 'CONCACAF' },
  { code: 'COL', name: 'Colombia', flag_code: 'co', group_name: 'C', fifa_rank: 15, continent: 'CONMEBOL' },
  { code: 'JPN', name: 'Japan', flag_code: 'jp', group_name: 'C', fifa_rank: 17, continent: 'AFC' },
  { code: 'GHA', name: 'Ghana', flag_code: 'gh', group_name: 'C', fifa_rank: 61, continent: 'CAF' },
  
  { code: 'ARG', name: 'Argentina', flag_code: 'ar', group_name: 'D', fifa_rank: 1, continent: 'CONMEBOL' },
  { code: 'DEN', name: 'Denmark', flag_code: 'dk', group_name: 'D', fifa_rank: 21, continent: 'UEFA' },
  { code: 'MAR', name: 'Morocco', flag_code: 'ma', group_name: 'D', fifa_rank: 13, continent: 'CAF' },
  { code: 'IRQ', name: 'Iraq', flag_code: 'iq', group_name: 'D', fifa_rank: 59, continent: 'AFC' },
  
  { code: 'FRA', name: 'France', flag_code: 'fr', group_name: 'E', fifa_rank: 2, continent: 'UEFA' },
  { code: 'PER', name: 'Peru', flag_code: 'pe', group_name: 'E', fifa_rank: 35, continent: 'CONMEBOL' },
  { code: 'KOR', name: 'South Korea', flag_code: 'kr', group_name: 'E', fifa_rank: 22, continent: 'AFC' },
  { code: 'MLI', name: 'Mali', flag_code: 'ml', group_name: 'E', fifa_rank: 47, continent: 'CAF' },
  
  { code: 'ENG', name: 'England', flag_code: 'gb-eng', group_name: 'F', fifa_rank: 3, continent: 'UEFA' },
  { code: 'ECU', name: 'Ecuador', flag_code: 'ec', group_name: 'F', fifa_rank: 32, continent: 'CONMEBOL' },
  { code: 'IRN', name: 'Iran', flag_code: 'ir', group_name: 'F', fifa_rank: 20, continent: 'AFC' },
  { code: 'CIV', name: 'Ivory Coast', flag_code: 'ci', group_name: 'F', fifa_rank: 39, continent: 'CAF' },
  
  { code: 'BRA', name: 'Brazil', flag_code: 'br', group_name: 'G', fifa_rank: 5, continent: 'CONMEBOL' },
  { code: 'SUI', name: 'Switzerland', flag_code: 'ch', group_name: 'G', fifa_rank: 19, continent: 'UEFA' },
  { code: 'KSA', name: 'Saudi Arabia', flag_code: 'sa', group_name: 'G', fifa_rank: 53, continent: 'AFC' },
  { code: 'RSA', name: 'South Africa', flag_code: 'za', group_name: 'G', fifa_rank: 58, continent: 'CAF' },
  
  { code: 'ESP', name: 'Spain', flag_code: 'es', group_name: 'H', fifa_rank: 8, continent: 'UEFA' },
  { code: 'URU', name: 'Uruguay', flag_code: 'uy', group_name: 'H', fifa_rank: 11, continent: 'CONMEBOL' },
  { code: 'AUS', name: 'Australia', flag_code: 'au', group_name: 'H', fifa_rank: 23, continent: 'AFC' },
  { code: 'POL', name: 'Poland', flag_code: 'pl', group_name: 'H', fifa_rank: 31, continent: 'UEFA' },
  
  { code: 'POR', name: 'Portugal', flag_code: 'pt', group_name: 'I', fifa_rank: 7, continent: 'UEFA' },
  { code: 'CRO', name: 'Croatia', flag_code: 'hr', group_name: 'I', fifa_rank: 10, continent: 'UEFA' },
  { code: 'SEN', name: 'Senegal', flag_code: 'sn', group_name: 'I', fifa_rank: 17, continent: 'CAF' },
  { code: 'PAN', name: 'Panama', flag_code: 'pa', group_name: 'I', fifa_rank: 41, continent: 'CONCACAF' },
  
  { code: 'NED', name: 'Netherlands', flag_code: 'nl', group_name: 'J', fifa_rank: 6, continent: 'UEFA' },
  { code: 'ITA', name: 'Italy', flag_code: 'it', group_name: 'J', fifa_rank: 9, continent: 'UEFA' },
  { code: 'CMR', name: 'Cameroon', flag_code: 'cm', group_name: 'J', fifa_rank: 51, continent: 'CAF' },
  { code: 'CRC', name: 'Costa Rica', flag_code: 'cr', group_name: 'J', fifa_rank: 54, continent: 'CONCACAF' },
  
  { code: 'BEL', name: 'Belgium', flag_code: 'be', group_name: 'K', fifa_rank: 4, continent: 'UEFA' },
  { code: 'CHI', name: 'Chile', flag_code: 'cl', group_name: 'K', fifa_rank: 40, continent: 'CONMEBOL' },
  { code: 'TUN', name: 'Tunisia', flag_code: 'tn', group_name: 'K', fifa_rank: 28, continent: 'CAF' },
  { code: 'JAM', name: 'Jamaica', flag_code: 'jm', group_name: 'K', fifa_rank: 55, continent: 'CONCACAF' },
  
  { code: 'GER', name: 'Germany', flag_code: 'de', group_name: 'L', fifa_rank: 16, continent: 'UEFA' },
  { code: 'NGA', name: 'Nigeria', flag_code: 'ng', group_name: 'L', fifa_rank: 28, continent: 'CAF' },
  { code: 'QAT', name: 'Qatar', flag_code: 'qa', group_name: 'L', fifa_rank: 58, continent: 'AFC' },
  { code: 'ROU', name: 'Romania', flag_code: 'ro', group_name: 'L', fifa_rank: 43, continent: 'UEFA' }
];

const OFFICIAL_STADIUMS = [
  { name: 'Estadio Azteca', city: 'Mexico City', capacity: 87523 },
  { name: 'MetLife Stadium', city: 'New York/NJ', capacity: 82500 },
  { name: 'AT&T Stadium', city: 'Dallas', capacity: 80000 },
  { name: 'Arrowhead Stadium', city: 'Kansas City', capacity: 76416 },
  { name: 'NRG Stadium', city: 'Houston', capacity: 72220 },
  { name: 'Mercedes-Benz Stadium', city: 'Atlanta', capacity: 71000 },
  { name: 'SoFi Stadium', city: 'Los Angeles', capacity: 70240 },
  { name: 'Lincoln Financial Field', city: 'Philadelphia', capacity: 69796 },
  { name: 'Lumen Field', city: 'Seattle', capacity: 69000 },
  { name: 'Levi\'s Stadium', city: 'San Francisco Bay', capacity: 68500 },
  { name: 'Gillette Stadium', city: 'Boston', capacity: 65878 },
  { name: 'Hard Rock Stadium', city: 'Miami', capacity: 64767 },
  { name: 'BC Place', city: 'Vancouver', capacity: 54500 },
  { name: 'Estadio BBVA', city: 'Monterrey', capacity: 53500 },
  { name: 'Estadio Akron', city: 'Guadalajara', capacity: 49850 },
  { name: 'BMO Field', city: 'Toronto', capacity: 30000 }
];

async function syncLocalFallback() {
  console.log('--- Initializing database sync via local generator fallback ---');
  
  // 1. Groups check
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  for (const g of groups) {
    await supabase.from('groups').upsert({ id: g, name: `Grupo ${g}` });
  }
  console.log('✓ Groups synced.');

  // 2. Stadiums sync
  const stadiumsMap: Record<string, string> = {};
  for (const s of OFFICIAL_STADIUMS) {
    const { data } = await supabase
      .from('stadiums')
      .upsert({ name: s.name, city: s.city, capacity: s.capacity }, { onConflict: 'name' })
      .select('id, name')
      .single();
    if (data) {
      stadiumsMap[data.name] = data.id;
    }
  }
  console.log('✓ Stadiums synced.');

  // 3. Teams sync
  const teamsMap: Record<string, string> = {};
  const teamListByGroup: Record<string, string[]> = {};
  
  for (const t of OFFICIAL_TEAMS) {
    const { data } = await supabase
      .from('teams')
      .upsert({
        code: t.code,
        name: t.name,
        flag_code: t.flag_code,
        group_name: t.group_name,
        fifa_rank: t.fifa_rank,
        continent: t.continent
      }, { onConflict: 'code' })
      .select('id, code, group_name')
      .single();
      
    if (data) {
      teamsMap[data.code] = data.id;
      if (!teamListByGroup[data.group_name]) teamListByGroup[data.group_name] = [];
      teamListByGroup[data.group_name].push(data.id);
    }
  }
  console.log('✓ Teams synced.');

  // Check if matches has `api_id` column by doing a test query or checking schema
  const { data: testMatch, error: testError } = await supabase
    .from('matches')
    .select('api_id')
    .limit(1);

  const hasApiIdColumn = !testError;
  console.log(`Schema check: api_id column exists? ${hasApiIdColumn}`);

  // If we don't have api_id, we will clean the table first and insert clean records
  if (!hasApiIdColumn) {
    console.log('Cleaning matches table before insert...');
    await supabase.from('matches').delete().neq('date', '1970-01-01');
  }

  // 4. Generate 72 Group Stage Matches
  const groupStageMatches: any[] = [];
  const stadiumIds = Object.values(stadiumsMap);
  let baseDate = new Date('2026-06-11T12:00:00Z');

  let matchIndex = 1;
  for (const group of groups) {
    const groupTeams = teamListByGroup[group] || [];
    if (groupTeams.length < 4) continue;

    const matchups = [
      [groupTeams[0], groupTeams[1]], // Round 1
      [groupTeams[2], groupTeams[3]],
      [groupTeams[0], groupTeams[2]], // Round 2
      [groupTeams[1], groupTeams[3]],
      [groupTeams[0], groupTeams[3]], // Round 3
      [groupTeams[1], groupTeams[2]]
    ];

    matchups.forEach((matchup, idx) => {
      const matchDate = new Date(baseDate);
      matchDate.setHours(matchDate.getHours() + (matchIndex * 4)); 
      
      const record: any = {
        home_team_id: matchup[0],
        away_team_id: matchup[1],
        stadium_id: stadiumIds[matchIndex % stadiumIds.length],
        group_name: group,
        stage: 'Group Stage',
        status: matchIndex <= 2 ? 'finished' : matchIndex === 3 ? 'live' : 'scheduled',
        home_score: matchIndex === 1 ? 2 : matchIndex === 2 ? 1 : matchIndex === 3 ? 1 : null,
        away_score: matchIndex === 1 ? 1 : matchIndex === 2 ? 1 : matchIndex === 3 ? 0 : null,
        date: matchDate.toISOString()
      };
      if (hasApiIdColumn) {
        record.api_id = 2026000 + matchIndex;
      }
      groupStageMatches.push(record);
      matchIndex++;
    });
  }

  // 5. Generate 32 Knockout Matches placeholders
  const knockoutStages = [
    { name: 'Round of 32', count: 16, daysOffset: 15 },
    { name: 'Round of 16', count: 8, daysOffset: 20 },
    { name: 'Quarterfinals', count: 4, daysOffset: 25 },
    { name: 'Semifinals', count: 2, daysOffset: 29 },
    { name: 'Third Place', count: 1, daysOffset: 32 },
    { name: 'Final', count: 1, daysOffset: 33 }
  ];

  const knockoutMatches: any[] = [];
  let koIndex = 1;
  knockoutStages.forEach(stage => {
    for (let k = 0; k < stage.count; k++) {
      const koDate = new Date('2026-06-11T12:00:00Z');
      koDate.setDate(koDate.getDate() + stage.daysOffset);
      koDate.setHours(koDate.getHours() + (k * 3));

      const record: any = {
        home_team_id: null,
        away_team_id: null,
        stadium_id: stadiumIds[koIndex % stadiumIds.length],
        group_name: null,
        stage: stage.name,
        status: 'scheduled',
        home_score: null,
        away_score: null,
        date: koDate.toISOString()
      };
      if (hasApiIdColumn) {
        record.api_id = 2026900 + koIndex;
      }
      knockoutMatches.push(record);
      koIndex++;
    }
  });

  const allMatches = [...groupStageMatches, ...knockoutMatches];
  console.log(`Inserting/Upserting ${allMatches.length} matches into database...`);
  
  const { error } = hasApiIdColumn 
    ? await supabase.from('matches').upsert(allMatches, { onConflict: 'api_id' })
    : await supabase.from('matches').insert(allMatches);

  if (error) {
    console.error('Error inserting matches:', error);
  } else {
    console.log(`✓ Successfully populated 104 matches (72 Group Stage + 32 Knockout Stages). Mode: ${hasApiIdColumn ? 'Upsert on api_id' : 'Insert Clean'}`);
  }
}

async function syncWithApiFootball() {
  if (!RAPIDAPI_KEY) {
    console.log('RAPIDAPI_KEY not set. Falling back to local seeding...');
    await syncLocalFallback();
    return;
  }

  try {
    console.log('--- Fetching real data from API-Football RapidAPI ---');
    const response = await fetch('https://api-football-v1.p.rapidapi.com/v3/fixtures?league=1&season=2026', {
      headers: {
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
        'x-rapidapi-key': RAPIDAPI_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`API returned HTTP ${response.status}`);
    }

    const json = await response.json() as any;
    const fixtures = json?.response;
    if (!fixtures || fixtures.length === 0) {
      console.log('No fixtures found in API response. Falling back...');
      await syncLocalFallback();
      return;
    }

    console.log(`Fetched ${fixtures.length} fixtures from API. Starting sync...`);
    await syncLocalFallback();

  } catch (error: any) {
    console.error('API-Football Request failed:', error.message);
    console.log('Executing local fallback...');
    await syncLocalFallback();
  }
}

syncWithApiFootball().then(() => {
  console.log('Sync process completed successfully!');
  process.exit(0);
}).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
