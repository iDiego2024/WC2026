import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

async function seed() {
  console.log('Seeding players and stats...');

  // Fetch teams from DB to get correct UUIDs
  const { data: teams, error: teamsError } = await supabase.from('teams').select('id, code');
  if (teamsError) throw teamsError;

  const teamIdMap: Record<string, string> = {};
  for (const t of teams) {
    teamIdMap[t.code] = t.id;
  }

  // 1. Clean existing players
  await supabase.from('players').delete().neq('name', 'none');

  const playersData = [
    { name: 'Kylian Mbappé', code: 'FRA', pos: 'FW', age: 27, club: 'Real Madrid', goals: 8, assists: 2, rating: 8.35 },
    { name: 'Lionel Messi', code: 'ARG', pos: 'FW', age: 38, club: 'Inter Miami', goals: 7, assists: 3, rating: 8.52 },
    { name: 'Julián Álvarez', code: 'ARG', pos: 'FW', age: 26, club: 'Atletico Madrid', goals: 4, assists: 0, rating: 7.45 },
    { name: 'Olivier Giroud', code: 'FRA', pos: 'FW', age: 39, club: 'LAFC', goals: 4, assists: 0, rating: 7.20 },
    { name: 'Bruno Fernandes', code: 'POR', pos: 'MF', age: 31, club: 'Manchester United', goals: 2, assists: 3, rating: 8.12 },
    { name: 'Harry Kane', code: 'ENG', pos: 'FW', age: 32, club: 'Bayern Munich', goals: 2, assists: 3, rating: 7.80 },
    { name: 'Antoine Griezmann', code: 'FRA', pos: 'MF', age: 35, club: 'Atletico Madrid', goals: 0, assists: 3, rating: 7.95 },
    { name: 'Emiliano Martínez', code: 'ARG', pos: 'GK', age: 33, club: 'Aston Villa', goals: 0, assists: 0, saves: 18, clean_sheets: 3, rating: 8.10 },
    { name: 'Dominik Livaković', code: 'CRO', pos: 'GK', age: 31, club: 'Fenerbahce', goals: 0, assists: 0, saves: 25, clean_sheets: 4, rating: 8.25 }
  ];

  for (const p of playersData) {
    const teamId = teamIdMap[p.code];
    if (!teamId) {
      console.warn(`No team UUID found for code: ${p.code}`);
      continue;
    }

    // Insert Player
    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert({
        name: p.name,
        position: p.pos,
        age: p.age,
        club: p.club,
        team_id: teamId
      })
      .select()
      .single();

    if (playerError) {
      console.error(`Error inserting player ${p.name}:`, playerError);
      continue;
    }

    // Insert Stats
    const { error: statsError } = await supabase
      .from('player_stats')
      .insert({
        player_id: player.id,
        goals: p.goals,
        assists: p.assists,
        saves: p.saves || 0,
        clean_sheets: p.clean_sheets || 0,
        rating: p.rating,
        minutes_played: 540,
        xg: p.goals * 0.82,
        xa: p.assists * 0.45
      });

    if (statsError) {
      console.error(`Error inserting stats for player ${p.name}:`, statsError);
    }
  }

  // 2. Also seed news_articles
  console.log('Seeding news articles...');
  await supabase.from('news_articles').delete().neq('title', 'none');

  const newsData = [
    {
      title: 'World Cup 2026: FIFA announces final stadiums and opening ceremony schedule',
      description: 'FIFA has released the official schedule for the opening matches in Mexico City, Dallas, and New York.',
      url: 'https://fifa.com/news/1',
      source_name: 'FIFA',
      team_code: 'MEX',
      published_at: new Date().toISOString()
    },
    {
      title: 'Argentina ELO Ranking hits #1 after flawless matches',
      description: 'Lionel Scaloni\'s side consolidates its lead as the overall favorite for the tournament.',
      url: 'https://theathletic.com/news/2',
      source_name: 'The Athletic',
      team_code: 'ARG',
      published_at: new Date(Date.now() - 3600 * 1000).toISOString()
    },
    {
      title: 'Mbappé leads Golden Boot forecasts following recent brace',
      description: 'The Real Madrid forward is backed by sports analytics models to retain the Golden Boot.',
      url: 'https://espn.com/news/3',
      source_name: 'ESPN',
      team_code: 'FRA',
      published_at: new Date(Date.now() - 7200 * 1000).toISOString()
    }
  ];

  const { error: newsError } = await supabase.from('news_articles').insert(newsData);
  if (newsError) console.error('Error inserting news articles:', newsError);

  console.log('Finished seeding players, stats, and news.');
}

seed().catch(console.error);
