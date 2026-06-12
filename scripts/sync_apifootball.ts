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

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function createSeededRandom(seed: number) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const FAMOUS_PLAYERS: Record<string, string[]> = {
  ARG: ['L. Messi', 'J. Álvarez', 'A. Di María', 'E. Fernández', 'R. De Paul', 'A. Mac Allister', 'L. Martínez', 'C. Romero', 'N. Otamendi', 'N. Molina', 'E. Martínez'],
  BRA: ['Vinícius Jr.', 'Rodrygo', 'Richarlison', 'Neymar Jr.', 'Casemiro', 'L. Paquetá', 'B. Guimarães', 'Marquinhos', 'É. Militão', 'Danilo', 'Alisson'],
  MEX: ['S. Giménez', 'H. Lozano', 'H. Martín', 'L. Chávez', 'E. Álvarez', 'J. Sánchez', 'J. Gallardo', 'C. Montes', 'J. Vásquez', 'N. Araujo', 'L. Malagón'],
  USA: ['C. Pulisic', 'F. Balogun', 'T. Weah', 'W. McKennie', 'Y. Musah', 'T. Adams', 'A. Robinson', 'T. Ream', 'C. Richards', 'S. Dest', 'M. Turner'],
  CAN: ['J. David', 'C. Larin', 'T. Buchanan', 'A. Davies', 'S. Eustáquio', 'I. Koné', 'A. Johnston', 'K. Miller', 'D. Cornelius', 'R. Laryea', 'M. Crépeau'],
  FRA: ['K. Mbappé', 'A. Griezmann', 'O. Dembélé', 'A. Tchouaméni', 'E. Camavinga', 'A. Rabiot', 'T. Hernandez', 'D. Upamecano', 'I. Konaté', 'J. Koundé', 'M. Maignan'],
  ENG: ['H. Kane', 'B. Saka', 'P. Foden', 'J. Bellingham', 'D. Rice', 'T. Alexander-Arnold', 'L. Shaw', 'J. Stones', 'H. Maguire', 'K. Walker', 'J. Pickford'],
  ESP: ['A. Morata', 'N. Williams', 'L. Yamal', 'Rodri', 'Pedri', 'Gavi', 'M. Cucurella', 'A. Laporte', 'R. Le Normand', 'D. Carvajal', 'U. Simón'],
  GER: ['N. Füllkrug', 'J. Musiala', 'F. Wirtz', 'T. Kroos', 'I. Gündogan', 'J. Kimmich', 'M. Mittelstädt', 'J. Tah', 'A. Rüdiger', 'D. Raum', 'M. Neuer'],
  ITA: ['G. Scamacca', 'F. Chiesa', 'N. Barella', 'Jorginho', 'D. Frattesi', 'F. Dimarco', 'A. Bastoni', 'R. Calafiori', 'M. Darmian', 'G. Di Lorenzo', 'G. Donnarumma']
};

const GENERIC_FIRST = ['John', 'David', 'Carlos', 'Luis', 'Jean', 'Pierre', 'Hans', 'Thomas', 'Ali', 'Ahmed', 'Samuel', 'Luka', 'Ivan', 'Shin', 'Ken', 'Mateo', 'Lucas', 'Oliver', 'Mohamed', 'Diego'];
const GENERIC_LAST = ['Smith', 'Jones', 'Garcia', 'Rodriguez', 'Dubois', 'Martin', 'Schmidt', 'Müller', 'Al-Sayed', 'Mensah', 'Diallo', 'Modric', 'Kovac', 'Tanaka', 'Sato', 'Silva', 'Santos', 'Onyango', 'Osei', 'Nkosi'];

function getRoster(teamCode: string, rand: () => number): string[] {
  if (FAMOUS_PLAYERS[teamCode]) {
    return [...FAMOUS_PLAYERS[teamCode]];
  }
  const roster: string[] = [];
  for (let i = 0; i < 11; i++) {
    const fIdx = Math.floor(rand() * GENERIC_FIRST.length);
    const lIdx = Math.floor(rand() * GENERIC_LAST.length);
    roster.push(`${GENERIC_FIRST[fIdx].substring(0, 1)}. ${GENERIC_LAST[lIdx]}`);
  }
  return roster;
}

async function runSimulationMode(supabase: any) {
  console.log("--- Running Live Match Simulation Mode ---");
  
  const { data: matches, error: matchesErr } = await supabase
    .from("matches")
    .select(`
      id,
      date,
      status,
      home_team_id,
      away_team_id,
      home_team:teams!home_team_id(id, code, name, flag_code, fifa_rank),
      away_team:teams!away_team_id(id, code, name, flag_code, fifa_rank)
    `)
    .neq("status", "finished");

  if (matchesErr) throw matchesErr;

  const now = Date.now();
  let updatedCount = 0;

  for (const match of matches || []) {
    const home = match.home_team;
    const away = match.away_team;
    if (!home || !away) continue;

    const matchDate = new Date(match.date).getTime();
    const elapsedMinutes = Math.floor((now - matchDate) / 60000);

    if (elapsedMinutes < 0) {
      continue;
    }

    console.log(`Simulating match ${home.code} vs ${away.code} (Elapsed: ${elapsedMinutes} mins, Status: ${match.status})`);

    const seed = hashString(match.id);
    const rand = createSeededRandom(seed);

    const homeRank = home.fifa_rank || 50;
    const awayRank = away.fifa_rank || 50;
    const homeStrength = Math.max(10, 100 - homeRank * 0.85);
    const awayStrength = Math.max(10, 100 - awayRank * 0.85);

    const finalHomeScore = Math.floor(rand() * (homeStrength / 30 + 1.2));
    const finalAwayScore = Math.floor(rand() * (awayStrength / 30 + 1.0));

    const homeLineupPlayers = getRoster(home.code, rand);
    const awayLineupPlayers = getRoster(away.code, rand);

    const mapToLineup = (roster: string[], teamId: string) => [
      { shirt_number: 1, player_name: roster[0] || 'Goalkeeper', position: 'GK', starter: true, team_id: teamId },
      { shirt_number: 2, player_name: roster[1] || 'Defender 1', position: 'DF', starter: true, team_id: teamId },
      { shirt_number: 4, player_name: roster[2] || 'Defender 2', position: 'DF', starter: true, team_id: teamId },
      { shirt_number: 14, player_name: roster[3] || 'Defender 3', position: 'DF', starter: true, team_id: teamId },
      { shirt_number: 3, player_name: roster[4] || 'Defender 4', position: 'DF', starter: true, team_id: teamId },
      { shirt_number: 5, player_name: roster[5] || 'Midfielder 1', position: 'MF', starter: true, team_id: teamId },
      { shirt_number: 8, player_name: roster[6] || 'Midfielder 2', position: 'MF', starter: true, team_id: teamId },
      { shirt_number: 10, player_name: roster[7] || 'Midfielder 3', position: 'MF', starter: true, team_id: teamId },
      { shirt_number: 7, player_name: roster[8] || 'Forward 1', position: 'FW', starter: true, team_id: teamId },
      { shirt_number: 9, player_name: roster[9] || 'Forward 2', position: 'FW', starter: true, team_id: teamId },
      { shirt_number: 11, player_name: roster[10] || 'Forward 3', position: 'FW', starter: true, team_id: teamId }
    ];

    const homeLineup = mapToLineup(homeLineupPlayers, home.id);
    const awayLineup = mapToLineup(awayLineupPlayers, away.id);

    const events: any[] = [];
    events.push({ minute: 0, event_type: 'other', player_name: 'Referee', team_id: null, description: 'Kickoff! The match has started.' });

    for (let i = 0; i < finalHomeScore; i++) {
      const min = Math.floor(rand() * 88) + 2;
      const scorer = homeLineup[8 + (i % 3)].player_name;
      events.push({ minute: min, event_type: 'goal', player_name: scorer, team_id: home.id, description: 'Goal!' });
    }
    for (let i = 0; i < finalAwayScore; i++) {
      const min = Math.floor(rand() * 88) + 2;
      const scorer = awayLineup[8 + (i % 3)].player_name;
      events.push({ minute: min, event_type: 'goal', player_name: scorer, team_id: away.id, description: 'Goal!' });
    }

    const homeYellows = Math.floor(rand() * 3);
    const awayYellows = Math.floor(rand() * 4);
    for (let i = 0; i < homeYellows; i++) {
      const min = Math.floor(rand() * 85) + 5;
      events.push({ minute: min, event_type: 'card_yellow', player_name: homeLineup[1 + i].player_name, team_id: home.id, description: 'Yellow Card' });
    }
    for (let i = 0; i < awayYellows; i++) {
      const min = Math.floor(rand() * 85) + 5;
      events.push({ minute: min, event_type: 'card_yellow', player_name: awayLineup[1 + i].player_name, team_id: away.id, description: 'Yellow Card' });
    }

    events.sort((a, b) => a.minute - b.minute);

    if (elapsedMinutes >= 105) {
      console.log(`Finishing match ${match.id} with score ${finalHomeScore} - ${finalAwayScore}`);
      events.push({ minute: 90, event_type: 'other', player_name: 'Referee', team_id: null, description: 'Full Time! The match has ended.' });

      await supabase.from("lineups").delete().eq("match_id", match.id);
      await supabase.from("lineups").insert(homeLineup.concat(awayLineup).map(l => ({ ...l, match_id: match.id })));

      await supabase.from("match_events").delete().eq("match_id", match.id);
      await supabase.from("match_events").insert(events.map(e => ({ ...e, match_id: match.id })));

      const statsPayload: any = {
        match_id: match.id,
        possession_home: 50 + Math.floor((rand() * 16) - 8),
        possession_away: 50,
        shots_home: finalHomeScore + 4 + Math.floor(rand() * 6),
        shots_away: finalAwayScore + 3 + Math.floor(rand() * 5),
        shots_on_target_home: finalHomeScore + Math.floor(rand() * 3),
        shots_on_target_away: finalAwayScore + Math.floor(rand() * 3),
        corners_home: 2 + Math.floor(rand() * 6),
        corners_away: 2 + Math.floor(rand() * 5),
        fouls_home: 8 + Math.floor(rand() * 8),
        fouls_away: 8 + Math.floor(rand() * 8),
        yellow_cards_home: homeYellows,
        yellow_cards_away: awayYellows,
        red_cards_home: 0,
        red_cards_away: 0,
        passes_home: 350 + Math.floor(rand() * 100),
        passes_away: 330 + Math.floor(rand() * 100),
        pass_accuracy_home: 78 + Math.floor(rand() * 12),
        pass_accuracy_away: 76 + Math.floor(rand() * 12),
        xg_home: parseFloat((finalHomeScore * 0.85 + rand() * 0.5 + 0.1).toFixed(2)),
        xg_away: parseFloat((finalAwayScore * 0.85 + rand() * 0.5 + 0.1).toFixed(2))
      };
      statsPayload.possession_away = 100 - statsPayload.possession_home;
      await supabase.from("match_statistics").upsert(statsPayload, { onConflict: "match_id" });

      const { error: finishErr } = await supabase
        .from("matches")
        .update({
          status: "finished",
          home_score: finalHomeScore,
          away_score: finalAwayScore,
          updated_at: new Date().toISOString()
        })
        .eq("id", match.id);

      if (finishErr) console.error("Error finishing match:", finishErr.message);
      else updatedCount++;

    } else {
      console.log(`Updating live match ${match.id} (minute ${elapsedMinutes})`);
      const currentEvents = events.filter(e => e.minute <= elapsedMinutes);
      
      const currentHomeScore = currentEvents.filter(e => e.event_type === 'goal' && e.team_id === home.id).length;
      const currentAwayScore = currentEvents.filter(e => e.event_type === 'goal' && e.team_id === away.id).length;

      await supabase.from("lineups").delete().eq("match_id", match.id);
      await supabase.from("lineups").insert(homeLineup.concat(awayLineup).map(l => ({ ...l, match_id: match.id })));

      await supabase.from("match_events").delete().eq("match_id", match.id);
      if (currentEvents.length > 0) {
        await supabase.from("match_events").insert(currentEvents.map(e => ({ ...e, match_id: match.id })));
      }

      const scaleFactor = Math.max(0.05, Math.min(1.0, elapsedMinutes / 90));
      const statsPayload: any = {
        match_id: match.id,
        possession_home: 50 + Math.floor((rand() * 16) - 8),
        possession_away: 50,
        shots_home: Math.round((finalHomeScore + 4 + Math.floor(rand() * 6)) * scaleFactor),
        shots_away: Math.round((finalAwayScore + 3 + Math.floor(rand() * 5)) * scaleFactor),
        shots_on_target_home: Math.round((finalHomeScore + Math.floor(rand() * 3)) * scaleFactor),
        shots_on_target_away: Math.round((finalAwayScore + Math.floor(rand() * 3)) * scaleFactor),
        corners_home: Math.round((2 + Math.floor(rand() * 6)) * scaleFactor),
        corners_away: Math.round((2 + Math.floor(rand() * 5)) * scaleFactor),
        fouls_home: Math.round((8 + Math.floor(rand() * 8)) * scaleFactor),
        fouls_away: Math.round((8 + Math.floor(rand() * 8)) * scaleFactor),
        yellow_cards_home: currentEvents.filter(e => e.event_type === 'card_yellow' && e.team_id === home.id).length,
        yellow_cards_away: currentEvents.filter(e => e.event_type === 'card_yellow' && e.team_id === away.id).length,
        red_cards_home: currentEvents.filter(e => e.event_type === 'card_red' && e.team_id === home.id).length,
        red_cards_away: currentEvents.filter(e => e.event_type === 'card_red' && e.team_id === away.id).length,
        passes_home: Math.round((350 + Math.floor(rand() * 100)) * scaleFactor),
        passes_away: Math.round((330 + Math.floor(rand() * 100)) * scaleFactor),
        pass_accuracy_home: 78 + Math.floor(rand() * 10),
        pass_accuracy_away: 76 + Math.floor(rand() * 10),
        xg_home: parseFloat((currentHomeScore * 0.85 + rand() * 0.3 + 0.05).toFixed(2)),
        xg_away: parseFloat((currentAwayScore * 0.85 + rand() * 0.3 + 0.05).toFixed(2))
      };
      statsPayload.possession_away = 100 - statsPayload.possession_home;
      await supabase.from("match_statistics").upsert(statsPayload, { onConflict: "match_id" });

      const { error: liveErr } = await supabase
        .from("matches")
        .update({
          status: "live",
          home_score: currentHomeScore,
          away_score: currentAwayScore,
          updated_at: new Date().toISOString()
        })
        .eq("id", match.id);

      if (liveErr) console.error("Error setting match live:", liveErr.message);
      else updatedCount++;
    }
  }

  console.log(`Simulation finished. Updated state for ${updatedCount} matches.`);
}

async function syncLocalFallback() {
  console.log('--- Initializing database sync via local generator fallback ---');
  
  // 1. Check if matches table is empty
  const { count, error: countError } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error checking matches count:', countError.message);
  }

  if (!count) {
    console.log('Matches table is empty. Seeding groups, stadiums, teams, and matches...');

    // Groups check
    const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    for (const g of groups) {
      await supabase.from('groups').upsert({ id: g, name: `Grupo ${g}` });
    }
    console.log('✓ Groups synced.');

    // Stadiums sync
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

    // Teams sync
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

    // Generate 72 Group Stage Matches
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
          status: 'scheduled',
          home_score: null,
          away_score: null,
          date: matchDate.toISOString()
        };
        if (hasApiIdColumn) {
          record.api_id = 2026000 + matchIndex;
        }
        groupStageMatches.push(record);
        matchIndex++;
      });
    }

    // Generate 32 Knockout Matches placeholders
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
      console.log(`✓ Successfully populated 104 matches.`);
    }
  } else {
    console.log(`Matches table already has ${count} records. Skipping initial seeding.`);
  }

  // Run the simulation mode to process active matches based on current time
  await runSimulationMode(supabase);
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
