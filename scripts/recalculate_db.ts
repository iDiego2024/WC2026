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

async function runRecalculation() {
  const startTime = Date.now();
  console.log('--- Starting Database Recalculation (ELO, Streaks, Standings) ---');


  // 1. Fetch Teams
  const { data: teams, error: teamsError } = await supabase.from('teams').select('*');
  if (teamsError || !teams) {
    console.error('Error fetching teams:', teamsError);
    process.exit(1);
  }

  // 2. Fetch Finished Matches
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'finished')
    .order('date', { ascending: true });

  if (matchesError || !matches) {
    console.error('Error fetching matches:', matchesError);
    process.exit(1);
  }

  console.log(`Loaded ${teams.length} teams and ${matches.length} finished matches.`);

  // --- PART A: Recalculate ELO Ratings and Team Streaks ---
  console.log('Calculating ELO ratings & team forms...');
  const eloMap: Record<string, number> = {};
  const teamForms: Record<string, string[]> = {};
  const teamStreaks: Record<string, { type: string; count: number }> = {};

  teams.forEach(t => {
    // Base ELO derived from FIFA rank: 1600 - (rank * 6)
    eloMap[t.id] = 1600 - (t.fifa_rank || 50) * 6;
    teamForms[t.id] = [];
    teamStreaks[t.id] = { type: '', count: 0 };
  });

  const K = 32;
  for (const match of matches) {
    const homeId = match.home_team_id;
    const awayId = match.away_team_id;
    if (!homeId || !awayId) continue;

    const homeElo = eloMap[homeId] || 1200;
    const awayElo = eloMap[awayId] || 1200;

    const expHome = 1 / (10 ** ((awayElo - homeElo) / 400) + 1);
    const expAway = 1 - expHome;

    let actHome = 0.5;
    let actAway = 0.5;
    let homeResult = 'D';
    let awayResult = 'D';

    if (match.home_score > match.away_score) {
      actHome = 1;
      actAway = 0;
      homeResult = 'W';
      awayResult = 'L';
    } else if (match.home_score < match.away_score) {
      actHome = 0;
      actAway = 1;
      homeResult = 'L';
      awayResult = 'W';
    }

    eloMap[homeId] = Math.round(homeElo + K * (actHome - expHome));
    eloMap[awayId] = Math.round(awayElo + K * (actAway - expAway));

    teamForms[homeId].push(homeResult);
    if (teamForms[homeId].length > 5) teamForms[homeId].shift();

    teamForms[awayId].push(awayResult);
    if (teamForms[awayId].length > 5) teamForms[awayId].shift();

    const updateStreak = (teamId: string, result: string) => {
      const current = teamStreaks[teamId];
      if (current.type === result) {
        current.count++;
      } else {
        current.type = result;
        current.count = 1;
      }
    };

    updateStreak(homeId, homeResult);
    updateStreak(awayId, awayResult);
  }

  // --- PART B: Recalculate cached group standings ---
  console.log('Calculating cached group standings statistics...');
  const statsMap: Record<string, {
    played: number;
    goals_for: number;
    goals_against: number;
    points: number;
  }> = {};

  teams.forEach(t => {
    statsMap[t.id] = { played: 0, goals_for: 0, goals_against: 0, points: 0 };
  });

  // Only finished Group Stage matches count towards Group Standings
  const groupMatches = matches.filter(m => m.stage === 'Group Stage');
  groupMatches.forEach(match => {
    const homeId = match.home_team_id;
    const awayId = match.away_team_id;
    if (!homeId || !awayId) return;

    const homeScore = match.home_score || 0;
    const awayScore = match.away_score || 0;

    const homeStats = statsMap[homeId];
    const awayStats = statsMap[awayId];

    homeStats.played++;
    awayStats.played++;
    homeStats.goals_for += homeScore;
    homeStats.goals_against += awayScore;
    awayStats.goals_for += awayScore;
    awayStats.goals_against += homeScore;

    if (homeScore > awayScore) {
      homeStats.points += 3;
    } else if (homeScore < awayScore) {
      awayStats.points += 3;
    } else {
      homeStats.points += 1;
      awayStats.points += 1;
    }
  });

  // --- PART C: Save everything back to Supabase ---
  console.log('Updating team standings and ELO columns in Supabase...');
  let updatedCount = 0;
  for (const team of teams) {
    const finalElo = eloMap[team.id];
    const form = teamForms[team.id];
    const streakObj = teamStreaks[team.id];
    const streakStr = streakObj.type ? `${streakObj.count}${streakObj.type}` : '0D';
    
    const stats = statsMap[team.id];
    const goalDifference = stats.goals_for - stats.goals_against;

    const { error: updateError } = await supabase
      .from('teams')
      .update({
        elo_rank: finalElo,
        recent_form: form,
        streak: streakStr,
        played: stats.played,
        goals_for: stats.goals_for,
        goals_against: stats.goals_against,
        goal_difference: goalDifference,
        points: stats.points
      })
      .eq('id', team.id);

    if (updateError) {
      console.error(`Failed to update team ${team.name}:`, updateError);
    } else {
      updatedCount++;
    }
  }

  // Create log in sync_logs table
  await supabase.from('sync_logs').insert({
    function_name: 'recalculate_db_local',
    status: 'success',
    records_updated: updatedCount,
    api_calls_count: 0,
    execution_time_ms: Date.now() - startTime,
    error_message: null
  });

  console.log(`✓ Completed database recalculation. Updated columns for ${updatedCount} teams.`);
}

runRecalculation();
