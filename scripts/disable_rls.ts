async function disableRLS() {
  const query = `
    ALTER TABLE match_events DISABLE ROW LEVEL SECURITY;
    ALTER TABLE lineups DISABLE ROW LEVEL SECURITY;
    ALTER TABLE match_statistics DISABLE ROW LEVEL SECURITY;
    ALTER TABLE h2h_cache DISABLE ROW LEVEL SECURITY;
    ALTER TABLE players DISABLE ROW LEVEL SECURITY;
    ALTER TABLE player_stats DISABLE ROW LEVEL SECURITY;
    ALTER TABLE player_tournament_stats DISABLE ROW LEVEL SECURITY;
    ALTER TABLE news_articles DISABLE ROW LEVEL SECURITY;
    ALTER TABLE tournament_insights DISABLE ROW LEVEL SECURITY;
  `;

  console.log('Disabling RLS on premium tables...');
  const res = await fetch('https://api.supabase.com/v1/projects/xvtofbktqqfsukxzylkt/database/query', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_ACCESS_TOKEN || ''}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('Failed to disable RLS:', data);
    process.exit(1);
  }

  console.log('RLS disabled successfully!', data);
}

disableRLS().catch(console.error);
